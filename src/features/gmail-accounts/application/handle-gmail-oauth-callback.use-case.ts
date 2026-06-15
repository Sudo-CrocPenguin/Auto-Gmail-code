import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { environment } from "../../../shared/config/environment";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import { GmailTokenVault } from "../infrastructure/gmail-token-vault";
import { GoogleGmailClient } from "../infrastructure/google-gmail.client";
import { GmailSyncService } from "./gmail-sync.service";

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
  public constructor(
    private readonly auditLogs: AuditLogRepository,
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly tokenVault: GmailTokenVault,
    private readonly gmailClient: GoogleGmailClient,
    private readonly gmailSyncService: GmailSyncService,
  ) {}

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

    if (!environment.google.clientId || !environment.google.clientSecret) {
      await this.writeAudit(decodedState, "GMAIL_OAUTH_CALLBACK_RECEIVED", "Callback OAuth demo recibido.", {
        accountId: decodedState.accountId ?? null,
        tokenExchangePending: true,
        configured: false,
      });

      return {
        redirectUrl: `${environment.frontendUrl}/gmail-accounts?oauth=success&state=${encodeURIComponent(
          input.state ?? "",
        )}`,
      };
    }

    try {
      const credentials = await this.gmailClient.exchangeCode(input.code);
      const profile = await this.gmailClient.getProfile(credentials);
      const account = await this.upsertAccount(decodedState, profile.emailAddress, profile.messagesTotal);

      await this.tokenVault.saveCredentials({
        workspaceId: account.workspaceId,
        gmailAccountId: account.id,
        credentials,
      });

      const syncResult = await this.gmailSyncService.syncAccount(
        {
          workspaceId: account.workspaceId,
          userId: decodedState.userId ?? null,
        },
        account,
      );

      await this.writeAudit(decodedState, "GMAIL_CONNECTED", `Cuenta ${profile.emailAddress} conectada.`, {
        accountId: account.id,
        syncedMessages: syncResult?.createdMessages ?? 0,
      });

      return {
        redirectUrl: `${environment.frontendUrl}/gmail-accounts?oauth=success&gmailAccountId=${encodeURIComponent(
          account.id,
        )}&email=${encodeURIComponent(profile.emailAddress)}&synced=${syncResult?.createdMessages ?? 0}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido conectando Gmail.";
      await this.writeAudit(decodedState, "GMAIL_OAUTH_FAILED", "Fallo intercambio OAuth de Google.", {
        error: message,
      });

      return {
        redirectUrl: `${environment.frontendUrl}/gmail-accounts?oauth=error&error=${encodeURIComponent(
          message,
        )}`,
      };
    }
  }

  private async upsertAccount(
    state: DecodedOAuthState,
    emailAddress: string,
    messagesTotal: number,
  ): Promise<GmailAccount> {
    const now = new Date().toISOString();
    const workspaceId = state.workspaceId;

    if (!workspaceId) {
      throw new Error("El state OAuth no contiene workspaceId.");
    }

    const accountFromState = state.accountId ? await this.gmailAccounts.findById(state.accountId) : null;
    if (accountFromState && accountFromState.workspaceId === workspaceId) {
      const updatedAccount = await this.gmailAccounts.update(accountFromState.id, {
        emailAddress,
        status: "CONNECTED",
        lastSyncAt: now,
        watchExpiration: null,
        totalMessages: messagesTotal,
        grantedScopes: environment.google.scopes,
        errorMessage: null,
      });

      if (updatedAccount) {
        return updatedAccount;
      }
    }

    const existingAccount = await this.gmailAccounts.findByEmail(workspaceId, emailAddress);
    if (existingAccount) {
      const updatedAccount = await this.gmailAccounts.update(existingAccount.id, {
        status: "CONNECTED",
        lastSyncAt: now,
        totalMessages: messagesTotal,
        grantedScopes: environment.google.scopes,
        errorMessage: null,
      });

      if (updatedAccount) {
        return updatedAccount;
      }
    }

    return this.gmailAccounts.create({
      id: randomUUID(),
      workspaceId,
      emailAddress,
      status: "CONNECTED",
      lastSyncAt: now,
      watchExpiration: null,
      totalMessages: messagesTotal,
      grantedScopes: environment.google.scopes,
      errorMessage: null,
      createdAt: now,
    });
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
