import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import type { GmailSyncLog } from "../domain/gmail-sync-log.entity";
import type { GmailSyncLogRepository } from "../domain/gmail-sync-log.repository";

export class GetGmailSyncLogDetailUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly syncLogs: GmailSyncLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    accountId: string,
    logId: string,
  ): Promise<GmailSyncLog> {
    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    const log = await this.syncLogs.findById(logId);
    if (!log || log.workspaceId !== context.workspaceId || log.gmailAccountId !== accountId) {
      throw new NotFoundError("El log de sincronizacion no existe.", "GMAIL_SYNC_LOG_NOT_FOUND");
    }

    return log;
  }
}
