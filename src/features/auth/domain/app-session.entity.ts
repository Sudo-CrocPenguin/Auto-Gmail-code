import type { UserRole } from "./user.entity";

export interface AppSession {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  ip: string | null;
  userAgent: string | null;
}
