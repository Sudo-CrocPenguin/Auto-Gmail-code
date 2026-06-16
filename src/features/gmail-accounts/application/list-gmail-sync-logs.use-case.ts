import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";
import type { GmailSyncLog } from "../domain/gmail-sync-log.entity";
import type { GmailSyncLogQueryParams, GmailSyncLogRepository } from "../domain/gmail-sync-log.repository";

export type ListGmailSyncLogsInput = Omit<GmailSyncLogQueryParams, "workspaceId" | "gmailAccountId">;

export class ListGmailSyncLogsUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly syncLogs: GmailSyncLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    accountId: string,
    input: ListGmailSyncLogsInput,
  ): Promise<PaginatedResult<GmailSyncLog>> {
    const account = await this.gmailAccounts.findById(accountId);
    if (!account || account.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La cuenta Gmail no existe.", "GMAIL_ACCOUNT_NOT_FOUND");
    }

    return this.syncLogs.findByAccount({
      ...input,
      workspaceId: context.workspaceId,
      gmailAccountId: accountId,
    });
  }
}
