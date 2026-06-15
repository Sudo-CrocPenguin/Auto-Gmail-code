import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { EmailCategory } from "./email-category";
import type { EmailMessage } from "./email-message.entity";

export interface EmailQueryParams extends PaginationParams {
  workspaceId: string;
  search?: string | undefined;
  gmailAccountId?: string | undefined;
  fromEmail?: string | undefined;
  fromDomain?: string | undefined;
  category?: EmailCategory | undefined;
  isImportant?: boolean | undefined;
  isSpam?: boolean | undefined;
  actionRequired?: boolean | undefined;
  hasAttachments?: boolean | undefined;
  isRead?: boolean | undefined;
  minImportanceScore?: number | undefined;
  minRiskScore?: number | undefined;
  minSecurityScore?: number | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortBy?: "receivedAt" | "importanceScore" | "riskScore" | "securityScore" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface EmailMessageRepository {
  findById(id: string): Promise<EmailMessage | null>;
  findByWorkspace(params: EmailQueryParams): Promise<PaginatedResult<EmailMessage>>;
  update(id: string, data: Partial<EmailMessage>): Promise<EmailMessage | null>;
}
