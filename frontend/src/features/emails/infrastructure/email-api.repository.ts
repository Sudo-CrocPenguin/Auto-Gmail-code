import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { EmailRepository } from "../application/email.repository";
import type { EmailSummary } from "../domain/email-message.entity";

export class EmailApiRepository implements EmailRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public listRecent(): Promise<PaginatedResponse<EmailSummary>> {
    return this.http.get<PaginatedResponse<EmailSummary>>("/emails", {
      page: 1,
      limit: 8,
      sortBy: "receivedAt",
      sortOrder: "desc",
    });
  }
}
