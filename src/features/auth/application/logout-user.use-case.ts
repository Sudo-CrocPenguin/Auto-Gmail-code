import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { AppSessionRepository } from "../domain/app-session.repository";

export class LogoutUserUseCase {
  public constructor(
    private readonly appSessions: AppSessionRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, ip: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.appSessions.revoke(context.sessionId, now);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "AUTH_LOGOUT",
      entityType: "User",
      entityId: context.userId,
      description: "Usuario cerro sesion.",
      ip,
      metadata: { sessionId: context.sessionId },
      createdAt: now,
    });
  }
}
