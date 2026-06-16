import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import { environment } from "../../../shared/config/environment";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { AppError } from "../../../shared/domain/errors/app-error";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import type { GmailSyncLogRepository } from "../domain/gmail-sync-log.repository";
import { GmailSyncService } from "./gmail-sync.service";

export class SyncGmailAccountUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly gmailSyncService: GmailSyncService,
    private readonly syncLogs: GmailSyncLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, accountId: string): Promise<GmailAccount> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden sincronizar Gmail.");

    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    if (account.status === "SYNCING") {
      throw new AppError("La cuenta Gmail ya tiene una sincronizacion en curso.", 409, "GMAIL_SYNC_IN_PROGRESS");
    }

    const syncResult = await this.gmailSyncService.syncAccount(context, account);
    if (syncResult) {
      return syncResult.account;
    }

    if (environment.persistenceDriver !== "memory") {
      const now = new Date().toISOString();
      await this.gmailAccounts.update(account.id, {
        status: "RECONNECT_REQUIRED",
        errorMessage: "La cuenta Gmail no tiene credenciales OAuth guardadas.",
      });
      await this.syncLogs.create({
        id: randomUUID(),
        workspaceId: context.workspaceId,
        gmailAccountId: account.id,
        status: "FAILED",
        startedAt: now,
        finishedAt: now,
        fetchedMessages: 0,
        createdMessages: 0,
        updatedMessages: 0,
        errorMessage: "La cuenta Gmail no tiene credenciales OAuth guardadas.",
        metadata: {
          mode: "real",
          reason: "missing_oauth_credentials",
          previousStatus: account.status,
        },
      });
      await this.auditLogs.create({
        id: randomUUID(),
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: "GMAIL_RECONNECT_REQUIRED",
        entityType: "GmailAccount",
        entityId: account.id,
        description: `Cuenta ${account.emailAddress} requiere reconexion OAuth antes de sincronizar.`,
        ip: null,
        metadata: {
          previousStatus: account.status,
          reason: "missing_oauth_credentials",
        },
        createdAt: now,
      });

      throw new AppError(
        "La cuenta Gmail requiere reconexion para sincronizar.",
        409,
        "GMAIL_RECONNECT_REQUIRED",
      );
    }

    const startedAt = new Date().toISOString();
    const updatedAccount = await this.gmailAccounts.update(account.id, {
      status: "CONNECTED",
      lastSyncAt: startedAt,
      totalMessages: account.totalMessages + 3,
      errorMessage: null,
    });

    await this.syncLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      gmailAccountId: account.id,
      status: "COMPLETED",
      startedAt,
      finishedAt: new Date().toISOString(),
      fetchedMessages: 3,
      createdMessages: 0,
      updatedMessages: 3,
      errorMessage: null,
      metadata: {
        mode: "demo",
        previousStatus: account.status,
        reason: "La cuenta demo no tiene credenciales OAuth guardadas.",
      },
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
