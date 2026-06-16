import { compare, hash } from "bcryptjs";
import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { AppError } from "../../../shared/domain/errors/app-error";
import type { AppSessionRepository } from "../domain/app-session.repository";
import type { UserRepository } from "../domain/user.repository";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  ip: string | null;
}

export class ChangePasswordUseCase {
  public constructor(
    private readonly users: UserRepository,
    private readonly appSessions: AppSessionRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, input: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(context.userId);
    if (!user) {
      throw new AppError("El usuario autenticado no existe.", 404, "USER_NOT_FOUND");
    }

    const currentPasswordMatches = await compare(input.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new AppError("La contrasena actual no es valida.", 401, "INVALID_CURRENT_PASSWORD");
    }

    await this.users.update(user.id, {
      passwordHash: await hash(input.newPassword, 10),
    });

    const now = new Date().toISOString();
    const revokedSessions = await this.appSessions.revokeActiveByUser(user.id, now, {
      exceptSessionId: context.sessionId,
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "AUTH_PASSWORD_CHANGED",
      entityType: "User",
      entityId: user.id,
      description: "Usuario cambio su contrasena.",
      ip: input.ip,
      metadata: { revokedSessions },
      createdAt: now,
    });
  }
}
