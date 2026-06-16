export interface GmailAccount {
  id: string;
  email: string;
  displayName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "RECONNECT_REQUIRED" | string;
  lastSyncAt?: string | null;
  historyId?: string | null;
}

export interface GmailOAuthStart {
  authUrl: string;
  state?: string;
}
