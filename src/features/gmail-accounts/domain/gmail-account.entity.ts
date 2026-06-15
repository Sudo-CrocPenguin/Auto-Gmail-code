export type GmailAccountStatus =
  | "CONNECTED"
  | "SYNCING"
  | "ERROR"
  | "DISCONNECTED"
  | "RECONNECT_REQUIRED";

export interface GmailAccount {
  id: string;
  workspaceId: string;
  emailAddress: string;
  status: GmailAccountStatus;
  lastSyncAt: string | null;
  watchExpiration: string | null;
  totalMessages: number;
  historyId: string | null;
  grantedScopes: string[];
  errorMessage: string | null;
  createdAt: string;
}
