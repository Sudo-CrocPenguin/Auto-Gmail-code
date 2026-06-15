import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { EmailCategory } from "./email-category";
import type { EmailMessage } from "./email-message.entity";

export interface EmailQueryParams extends PaginationParams {
  workspaceId: string;
  search?: string;
  gmailAccountId?: string;
  fromEmail?: string;
  fromDomain?: string;
  category?: EmailCategory;
  isImportant?: boolean;
  isSpam?: boolean;
  actionRequired?: boolean;
  hasAttachments?: boolean;
  isRead?: boolean;
  minImportanceScore?: number;
  minRiskScore?: number;
  minSecurityScore?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "receivedAt" | "importanceScore" | "riskScore" | "securityScore";
  sortOrder?: "asc" | "desc";
}

export interface EmailMessageRepository {
  findById(id: string): Promise<EmailMessage | null>;
  findByWorkspace(params: EmailQueryParams): Promise<PaginatedResult<EmailMessage>>;
  update(id: string, data: Partial<EmailMessage>): Promise<EmailMessage | null>;
}

