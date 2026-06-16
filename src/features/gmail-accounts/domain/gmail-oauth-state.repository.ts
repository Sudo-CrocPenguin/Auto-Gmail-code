import type { StoredGmailOAuthState } from "./gmail-oauth-state.entity";

export interface GmailOAuthStateRepository {
  create(state: StoredGmailOAuthState): Promise<StoredGmailOAuthState>;
  consume(stateHash: string, consumedAt: string): Promise<StoredGmailOAuthState | null>;
  deleteExpired(now: string): Promise<number>;
}
