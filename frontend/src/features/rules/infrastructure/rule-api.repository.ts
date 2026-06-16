import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { RuleRepository } from "../application/rule.repository";
import type { AutomationRule } from "../domain/automation-rule.entity";

export class RuleApiRepository implements RuleRepository {
  private readonly http: HttpClient;

  public constructor(http: HttpClient) {
    this.http = http;
  }

  public list(): Promise<PaginatedResponse<AutomationRule>> {
    return this.http.get<PaginatedResponse<AutomationRule>>("/rules", {
      page: 1,
      limit: 6,
    });
  }
}
