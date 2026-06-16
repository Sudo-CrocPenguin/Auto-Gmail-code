import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { EmailDetail, EmailListQuery, EmailSummary } from "../domain/email-message.entity";

export interface EmailRepository {
  list(query?: EmailListQuery): Promise<PaginatedResponse<EmailSummary>>;
  listRecent(): Promise<PaginatedResponse<EmailSummary>>;
  detail(emailId: string): Promise<EmailDetail>;
  markReviewed(emailId: string): Promise<EmailDetail>;
  markImportant(emailId: string): Promise<EmailDetail>;
}
