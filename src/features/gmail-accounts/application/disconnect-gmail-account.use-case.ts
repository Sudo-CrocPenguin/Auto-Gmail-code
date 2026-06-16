import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import { GmailTokenVault } from "../infrastructure/gmail-token-vault";
import { GoogleGmailClient } from "../infrastructure/google-gmail.client";

type RevocationStatus = "revoked" | "skipped" | "failed";

export class DisconnectGmailAccountUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly tokenVault: GmailTokenVault,
    private readonly gmailClient: GoogleGmailClient,
  ) {}

  public async execute(context: AuthenticatedContext, accountId: string): Promise<GmailAccount> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden desconectar Gmail.");

    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    const revocation = await this.revokeRemoteCredentials(account.id);
    const updatedAccount = await this.gmailAccounts.update(account.id, {
      status: "DISCONNECTED",
      watchExpiration: null,
      errorMessage: null,
    });
    await this.tokenVault.deleteCredentials(account.id);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "GMAIL_DISCONNECTED",
      entityType: "GmailAccount",
      entityId: account.id,
      description: `Cuenta ${account.emailAddress} desconectada.`,
      ip: null,
      metadata: {
        previousStatus: account.status,
        tokenRevocationStatus: revocation.status,
        tokenRevocationError: revocation.errorMessage,
      },
      createdAt: new Date().toISOString(),
    });

    if (!updatedAccount) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    return updatedAccount;
  }

  private async revokeRemoteCredentials(
    gmailAccountId: string,
  ): Promise<{ status: RevocationStatus; errorMessage: string | null }> {
    const credentials = await this.tokenVault.getCredentials(gmailAccountId);
    if (!credentials?.refresh_token && !credentials?.access_token) {
      return { status: "skipped", errorMessage: null };
    }

    try {
      return {
        status: await this.gmailClient.revokeCredentials(credentials),
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "No fue posible revocar token OAuth en Google.",
      };
    }
  }
}
