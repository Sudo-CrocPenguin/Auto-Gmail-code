import type { GmailOAuthToken } from "./gmail-oauth-token.entity";

export interface GmailOAuthTokenRepository {
  upsert(token: GmailOAuthToken): Promise<GmailOAuthToken>;
  findByAccountId(gmailAccountId: string): Promise<GmailOAuthToken | null>;
  deleteByAccountId(gmailAccountId: string): Promise<boolean>;
}

