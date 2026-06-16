import type { DataEnvelope } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { SettingsRepository } from "../application/settings.repository";
import type { WorkspaceSettings } from "../domain/workspace-settings.entity";

export class SettingsApiRepository implements SettingsRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public async get(): Promise<WorkspaceSettings> {
    const payload = await this.http.get<DataEnvelope<WorkspaceSettings>>("/settings");
    return unwrapData(payload);
  }
}
