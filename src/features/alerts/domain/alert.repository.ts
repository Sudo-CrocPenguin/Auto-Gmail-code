import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { Alert, AlertSeverity, AlertStatus, AlertType } from "./alert.entity";

export interface AlertQueryParams extends PaginationParams {
  workspaceId: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
}

export interface AlertRepository {
  findById(id: string): Promise<Alert | null>;
  findByWorkspace(params: AlertQueryParams): Promise<PaginatedResult<Alert>>;
  update(id: string, data: Partial<Alert>): Promise<Alert | null>;
}

