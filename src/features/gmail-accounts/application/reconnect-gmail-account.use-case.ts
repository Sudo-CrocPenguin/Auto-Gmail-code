import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import { environment } from "../../../shared/config/environment";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import { GoogleGmailClient } from "../infrastructure/google-gmail.client";
import { OAuthStateService } from "./oauth-state.service";

export class ReconnectGmailAccountUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly gmailClient: GoogleGmailClient,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  public async execute(context: AuthenticatedContext, accountId: string) {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden reconectar Gmail.");

    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    const configured = Boolean(environment.google.clientId && environment.google.clientSecret);
    const state = this.oauthStateService.sign({
      workspaceId: context.workspaceId,
      userId: context.userId,
      accountId,
      nonce: randomUUID(),
    });

    const authUrl = configured
      ? this.gmailClient.buildAuthUrl(state)
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
