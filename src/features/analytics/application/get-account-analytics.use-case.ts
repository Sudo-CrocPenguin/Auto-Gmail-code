import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { GmailAccountRepository } from "../../gmail-accounts/domain/gmail-account.repository";

export class GetAccountAnalyticsUseCase {
  public constructor(private readonly gmailAccounts: GmailAccountRepository) {}

  public async execute(context: AuthenticatedContext) {
    const accounts = await this.gmailAccounts.findByWorkspaceId(context.workspaceId);

    return accounts.map((account) => ({
      gmailAccountId: account.id,
      emailAddress: account.emailAddress,
      status: account.status,
      totalMessages: account.totalMessages,
      lastSyncAt: account.lastSyncAt,
    }));
  }
}

