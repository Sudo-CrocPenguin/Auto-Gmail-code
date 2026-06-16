import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { EmailSummary } from "../domain/email-message.entity";

export interface EmailRepository {
  listRecent(): Promise<PaginatedResponse<EmailSummary>>;
}
