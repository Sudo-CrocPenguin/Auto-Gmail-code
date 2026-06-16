export interface GmailAccount {
  id: string;
  email: string;
  emailAddress?: string;
  displayName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "RECONNECT_REQUIRED" | string;
  lastSyncAt?: string | null;
  historyId?: string | null;
  totalMessages?: number;
  errorMessage?: string | null;
}

export interface GmailOAuthStart {
  authUrl: string;
  state?: string;
  provider?: "GOOGLE";
  configured: boolean;
}

export type GmailOAuthNoticeStatus = "success" | "error" | "demo";

export interface GmailOAuthNotice {
  status: GmailOAuthNoticeStatus;
  message: string;
  email?: string;
  synced?: number;
}
