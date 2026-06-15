import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { AuditLog } from "../domain/audit-log.entity";
import type { AuditLogRepository, AuditQueryParams } from "../domain/audit-log.repository";

export type ListAuditLogsInput = Omit<AuditQueryParams, "workspaceId">;

export class ListAuditLogsUseCase {
  public constructor(private readonly auditLogs: AuditLogRepository) {}

  public async execute(
    context: AuthenticatedContext,
    input: ListAuditLogsInput,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogs.findByWorkspace({
      ...input,
      workspaceId: context.workspaceId,
    });
  }
}

