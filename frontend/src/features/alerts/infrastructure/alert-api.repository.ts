import type { DataEnvelope, PaginatedResponse } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
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

  public async resolve(alertId: string): Promise<WorkspaceAlert> {
    const payload = await this.http.post<DataEnvelope<WorkspaceAlert>>(`/alerts/${alertId}/resolve`);
    return unwrapData(payload);
  }

  public async ignore(alertId: string): Promise<WorkspaceAlert> {
    const payload = await this.http.post<DataEnvelope<WorkspaceAlert>>(`/alerts/${alertId}/ignore`);
    return unwrapData(payload);
  }
}
