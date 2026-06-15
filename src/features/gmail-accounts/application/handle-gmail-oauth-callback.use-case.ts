import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { environment } from "../../../shared/config/environment";

export interface HandleGmailOAuthCallbackInput {
  code?: string | undefined;
  state?: string | undefined;
  error?: string | undefined;
}

interface DecodedOAuthState {
  workspaceId?: string;
  userId?: string;
  accountId?: string;
}

export class HandleGmailOAuthCallbackUseCase {
  public constructor(private readonly auditLogs: AuditLogRepository) {}

  public async execute(input: HandleGmailOAuthCallbackInput) {
    const decodedState = decodeState(input.state);

    if (input.error || !input.code) {
      await this.writeAudit(decodedState, "GMAIL_OAUTH_FAILED", "Google OAuth no se completo.", {
        error: input.error ?? "missing_code",
      });

      return {
        redirectUrl: `${environment.frontendUrl}/gmail-accounts?oauth=error&error=${encodeURIComponent(
          input.error ?? "missing_code",
        )}`,
      };
    }

    await this.writeAudit(decodedState, "GMAIL_OAUTH_CALLBACK_RECEIVED", "Callback OAuth recibido.", {
      accountId: decodedState.accountId ?? null,
      tokenExchangePending: true,
    });

    return {
      redirectUrl: `${environment.frontendUrl}/gmail-accounts?oauth=success&state=${encodeURIComponent(
        input.state ?? "",
      )}`,
    };
  }

  private async writeAudit(
    state: DecodedOAuthState,
    action: string,
    description: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    if (!state.workspaceId) {
      return;
    }

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: state.workspaceId,
      userId: state.userId ?? null,
      action,
      entityType: "GmailAccount",
      entityId: state.accountId ?? null,
      description,
      ip: null,
      metadata,
      createdAt: new Date().toISOString(),
    });
  }
}

function decodeState(state: string | undefined): DecodedOAuthState {
  if (!state) {
    return {};
  }

  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as DecodedOAuthState;
  } catch {
    return {};
  }
}

