import type { UserRole } from "../../features/auth/domain/user.entity";

export interface AuthenticatedContext {
  sessionId: string;
  userId: string;
  workspaceId: string;
  role: UserRole;
}
