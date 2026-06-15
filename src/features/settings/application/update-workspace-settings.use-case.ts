import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { WorkspaceSettings } from "../domain/workspace-settings.entity";
import type { WorkspaceSettingsRepository } from "../domain/workspace-settings.repository";

export class UpdateWorkspaceSettingsUseCase {
  public constructor(
    private readonly settings: WorkspaceSettingsRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    input: WorkspaceSettings,
  ): Promise<WorkspaceSettings> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden cambiar configuracion.");

    const updatedSettings = await this.settings.update(context.workspaceId, input);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "SETTINGS_UPDATED",
      entityType: "WorkspaceSettings",
      entityId: context.workspaceId,
      description: "Configuracion del workspace actualizada.",
      ip: null,
      metadata: {
        theme: updatedSettings.theme,
        language: updatedSettings.language,
      },
      createdAt: new Date().toISOString(),
    });

    return updatedSettings;
  }
}

