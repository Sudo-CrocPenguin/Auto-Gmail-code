import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { AlertRepository } from "../application/alert.repository";
import type { WorkspaceAlert } from "../domain/workspace-alert.entity";

export class AlertApiRepository implements AlertRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public listOpen(): Promise<PaginatedResponse<WorkspaceAlert>> {
    return this.http.get<PaginatedResponse<WorkspaceAlert>>("/alerts", {
      page: 1,
      limit: 6,
      status: "NEW",
    });
  }
}
