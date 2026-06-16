import type { AppSession } from "./app-session.entity";

export interface AppSessionRepository {
  create(session: AppSession): Promise<AppSession>;
  findById(id: string): Promise<AppSession | null>;
  touch(id: string, lastUsedAt: string): Promise<AppSession | null>;
  revoke(id: string, revokedAt: string): Promise<AppSession | null>;
  revokeActiveByUser(
    userId: string,
    revokedAt: string,
    options?: { exceptSessionId?: string },
  ): Promise<number>;
}
