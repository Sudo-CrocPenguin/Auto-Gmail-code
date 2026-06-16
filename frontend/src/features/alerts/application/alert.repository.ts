import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { WorkspaceAlert } from "../domain/workspace-alert.entity";

export interface AlertRepository {
  listOpen(): Promise<PaginatedResponse<WorkspaceAlert>>;
  resolve(alertId: string): Promise<WorkspaceAlert>;
  ignore(alertId: string): Promise<WorkspaceAlert>;
}
