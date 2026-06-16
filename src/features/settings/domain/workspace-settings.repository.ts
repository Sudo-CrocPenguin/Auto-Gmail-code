import type { WorkspaceSettings } from "./workspace-settings.entity";

export interface WorkspaceSettingsRepository {
  getByWorkspaceId(workspaceId: string): Promise<WorkspaceSettings>;
  update(workspaceId: string, settings: WorkspaceSettings): Promise<WorkspaceSettings>;
}

