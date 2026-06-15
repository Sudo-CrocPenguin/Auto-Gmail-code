export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  ip: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

