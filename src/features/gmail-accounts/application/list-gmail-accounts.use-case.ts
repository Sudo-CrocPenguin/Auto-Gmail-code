import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { GmailAccount } from "../domain/gmail-account.entity";
import type { GmailAccountRepository } from "../domain/gmail-account.repository";

export class ListGmailAccountsUseCase {
  public constructor(private readonly gmailAccounts: GmailAccountRepository) {}

  public async execute(context: AuthenticatedContext): Promise<GmailAccount[]> {
    return this.gmailAccounts.findByWorkspaceId(context.workspaceId);
  }
}

