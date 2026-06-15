import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { AuditLog } from "./audit-log.entity";

export interface AuditQueryParams extends PaginationParams {
  workspaceId: string;
  action?: string | undefined;
  userId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
}

export interface AuditLogRepository {
  create(log: AuditLog): Promise<AuditLog>;
  findByWorkspace(params: AuditQueryParams): Promise<PaginatedResult<AuditLog>>;
}
