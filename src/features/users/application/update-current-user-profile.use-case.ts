import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { PublicUser } from "../../auth/domain/user.entity";
import { toPublicUser } from "../../auth/domain/user.entity";
import type { UserRepository } from "../../auth/domain/user.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { AppError } from "../../../shared/domain/errors/app-error";

export interface UpdateCurrentUserProfileInput {
  name: string;
  ip: string | null;
}

export class UpdateCurrentUserProfileUseCase {
  public constructor(
    private readonly users: UserRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    input: UpdateCurrentUserProfileInput,
  ): Promise<PublicUser> {
    const user = await this.users.findById(context.userId);
    if (!user) {
      throw new AppError("El usuario autenticado no existe.", 404, "USER_NOT_FOUND");
    }

    const updatedUser = await this.users.update(user.id, {
      name: input.name,
    });

    if (!updatedUser) {
      throw new AppError("No fue posible actualizar el usuario.", 409, "USER_UPDATE_FAILED");
    }

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "USER_PROFILE_UPDATED",
      entityType: "User",
      entityId: user.id,
      description: "Usuario actualizo su perfil.",
      ip: input.ip,
      metadata: {
        previousName: user.name,
        newName: updatedUser.name,
      },
      createdAt: new Date().toISOString(),
    });

    return toPublicUser(updatedUser);
  }
}
