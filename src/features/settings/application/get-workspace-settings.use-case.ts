import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { WorkspaceSettings } from "../domain/workspace-settings.entity";
import type { WorkspaceSettingsRepository } from "../domain/workspace-settings.repository";

export class GetWorkspaceSettingsUseCase {
  public constructor(private readonly settings: WorkspaceSettingsRepository) {}

  public async execute(context: AuthenticatedContext): Promise<WorkspaceSettings> {
    return this.settings.getByWorkspaceId(context.workspaceId);
  }
}

