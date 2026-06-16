export interface GmailOAuthToken {
  gmailAccountId: string;
  workspaceId: string;
  encryptedAccessToken: string | null;
  encryptedRefreshToken: string | null;
  encryptedIdToken: string | null;
  scope: string | null;
  tokenType: string | null;
  expiryDate: number | null;
  createdAt: string;
  updatedAt: string;
}

