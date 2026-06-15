import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { ForbiddenError } from "../../../shared/domain/errors/forbidden-error";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { Workspace } from "../domain/workspace.entity";
import type { WorkspaceRepository } from "../domain/workspace.repository";

export interface UpdateCurrentWorkspaceInput {
  name?: string | undefined;
  plan?: string | undefined;
}

export class UpdateCurrentWorkspaceUseCase {
  public constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    input: UpdateCurrentWorkspaceInput,
  ): Promise<Workspace> {
    if (context.role !== "OWNER" && context.role !== "ADMIN") {
      throw new ForbiddenError("Solo propietarios o administradores pueden modificar el workspace.");
    }

    const updateData: Partial<Pick<Workspace, "name" | "plan">> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.plan !== undefined) updateData.plan = input.plan;

    const workspace = await this.workspaces.update(context.workspaceId, updateData);
    if (!workspace) {
      throw new NotFoundError("El workspace no existe.", "WORKSPACE_NOT_FOUND");
    }

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "WORKSPACE_UPDATED",
      entityType: "Workspace",
      entityId: context.workspaceId,
      description: "Workspace actualizado.",
      ip: null,
      metadata: { ...updateData },
      createdAt: new Date().toISOString(),
    });

    return workspace;
  }
}
