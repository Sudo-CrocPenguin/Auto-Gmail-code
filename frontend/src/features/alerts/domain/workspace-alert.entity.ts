export interface WorkspaceAlert {
  id: string;
  gmailAccountId?: string;
  emailMessageId?: string | null;
  type?: string;
  title: string;
  description?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  status: "NEW" | "RESOLVED" | "IGNORED" | string;
  recommendedAction?: string;
  createdAt: string;
  resolvedAt?: string | null;
}
