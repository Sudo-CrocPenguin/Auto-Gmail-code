export interface WorkspaceAlert {
  id: string;
  title: string;
  description?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  status: "NEW" | "RESOLVED" | "IGNORED" | string;
  createdAt: string;
}
