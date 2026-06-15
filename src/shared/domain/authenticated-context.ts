import type { UserRole } from "../../features/auth/domain/user.entity";

export interface AuthenticatedContext {
  userId: string;
  workspaceId: string;
  role: UserRole;
}

