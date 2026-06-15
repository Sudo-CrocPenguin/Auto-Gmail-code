import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { Alert, AlertSeverity, AlertStatus, AlertType } from "./alert.entity";

export interface AlertQueryParams extends PaginationParams {
  workspaceId: string;
  status?: AlertStatus | undefined;
  severity?: AlertSeverity | undefined;
  type?: AlertType | undefined;
}

export interface AlertRepository {
  create(alert: Alert): Promise<Alert>;
  findById(id: string): Promise<Alert | null>;
  findByWorkspace(params: AlertQueryParams): Promise<PaginatedResult<Alert>>;
  update(id: string, data: Partial<Alert>): Promise<Alert | null>;
}
