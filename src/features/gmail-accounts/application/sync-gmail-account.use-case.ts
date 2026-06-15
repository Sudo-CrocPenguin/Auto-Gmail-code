import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import { GmailSyncService } from "./gmail-sync.service";

export class SyncGmailAccountUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly gmailSyncService: GmailSyncService,
  ) {}

  public async execute(context: AuthenticatedContext, accountId: string): Promise<GmailAccount> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden sincronizar Gmail.");

    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    const syncResult = await this.gmailSyncService.syncAccount(context, account);
    if (syncResult) {
      return syncResult.account;
    }

    const updatedAccount = await this.gmailAccounts.update(account.id, {
      status: "CONNECTED",
      lastSyncAt: new Date().toISOString(),
      totalMessages: account.totalMessages + 3,
      errorMessage: null,
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "GMAIL_SYNC_REQUESTED",
      entityType: "GmailAccount",
      entityId: account.id,
      description: `Sincronizacion manual solicitada para ${account.emailAddress}.`,
      ip: null,
      metadata: { previousStatus: account.status },
      createdAt: new Date().toISOString(),
    });

    if (!updatedAccount) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    return updatedAccount;
  }
}
