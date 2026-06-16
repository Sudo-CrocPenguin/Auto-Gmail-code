export type GmailSyncLogStatus = "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface GmailSyncLog {
  id: string;
  workspaceId: string;
  gmailAccountId: string;
  status: GmailSyncLogStatus;
  startedAt: string;
  finishedAt: string | null;
  fetchedMessages: number;
  createdMessages: number;
  updatedMessages: number;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
}
