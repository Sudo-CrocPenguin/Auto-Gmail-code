import type { WorkspaceSettings } from "../domain/workspace-settings.entity";

export interface SettingsRepository {
  get(): Promise<WorkspaceSettings>;
}
