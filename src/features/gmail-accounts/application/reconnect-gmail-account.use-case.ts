import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import { environment } from "../../../shared/config/environment";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";

export class ReconnectGmailAccountUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, accountId: string) {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden reconectar Gmail.");

    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    const configured = Boolean(environment.google.clientId && environment.google.clientSecret);
    const state = Buffer.from(
      JSON.stringify({
        workspaceId: context.workspaceId,
        userId: context.userId,
        accountId,
        nonce: randomUUID(),
      }),
    ).toString("base64url");

    const authUrl = configured
      ? `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
          client_id: environment.google.clientId,
          redirect_uri: environment.google.redirectUri,
          response_type: "code",
          scope: environment.google.scopes.join(" "),
          access_type: "offline",
          prompt: "consent",
          state,
        }).toString()}`
      : `${environment.frontendUrl}/gmail-accounts?oauth=reconnect-demo&accountId=${accountId}&state=${state}`;

    if (!configured) {
      await this.gmailAccounts.update(account.id, {
        status: "CONNECTED",
        errorMessage: null,
        watchExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "GMAIL_RECONNECT_STARTED",
      entityType: "GmailAccount",
      entityId: account.id,
      description: `Reconexion OAuth iniciada para ${account.emailAddress}.`,
      ip: null,
      metadata: { configured },
      createdAt: new Date().toISOString(),
    });

    return {
      authUrl,
      state,
      configured,
    };
  }
}

