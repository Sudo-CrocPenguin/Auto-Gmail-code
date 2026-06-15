import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { AuditLog } from "./audit-log.entity";

export interface AuditQueryParams extends PaginationParams {
  workspaceId: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogRepository {
  create(log: AuditLog): Promise<AuditLog>;
  findByWorkspace(params: AuditQueryParams): Promise<PaginatedResult<AuditLog>>;
}

