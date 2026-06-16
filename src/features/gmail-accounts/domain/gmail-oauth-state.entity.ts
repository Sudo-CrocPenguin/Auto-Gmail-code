export interface StoredGmailOAuthState {
  id: string;
  workspaceId: string;
  userId: string;
  accountId: string | null;
  nonce: string;
  stateHash: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}
