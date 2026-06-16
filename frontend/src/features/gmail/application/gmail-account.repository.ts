import type { GmailAccount, GmailOAuthStart } from "../domain/gmail-account.entity";

export interface GmailAccountRepository {
  list(): Promise<GmailAccount[]>;
  startOAuth(): Promise<GmailOAuthStart>;
  sync(accountId: string): Promise<GmailAccount>;
}
