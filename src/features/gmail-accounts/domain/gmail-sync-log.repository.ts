import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { GmailSyncLog } from "./gmail-sync-log.entity";

export interface GmailSyncLogQueryParams extends PaginationParams {
  workspaceId: string;
  gmailAccountId: string;
  status?: GmailSyncLog["status"] | undefined;
}

export interface GmailSyncLogRepository {
  create(log: GmailSyncLog): Promise<GmailSyncLog>;
  findById(id: string): Promise<GmailSyncLog | null>;
  findByAccount(params: GmailSyncLogQueryParams): Promise<PaginatedResult<GmailSyncLog>>;
  update(id: string, data: Partial<GmailSyncLog>): Promise<GmailSyncLog | null>;
}
