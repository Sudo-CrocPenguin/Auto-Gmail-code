import type { DataEnvelope, PaginatedResponse } from "../../../shared/domain/api-response";
import { unwrapData } from "../../../shared/domain/api-response";
import type { HttpClient } from "../../../shared/infrastructure/http/http-client";
import type { RuleRepository } from "../application/rule.repository";
import type { AutomationRule, CreateAutomationRuleInput } from "../domain/automation-rule.entity";

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

  public async create(input: CreateAutomationRuleInput): Promise<AutomationRule> {
    const payload = await this.http.post<DataEnvelope<AutomationRule>>("/rules", input);
    return unwrapData(payload);
  }

  public async enable(ruleId: string): Promise<AutomationRule> {
    const payload = await this.http.post<DataEnvelope<AutomationRule>>(`/rules/${ruleId}/enable`);
    return unwrapData(payload);
  }

  public async disable(ruleId: string): Promise<AutomationRule> {
    const payload = await this.http.post<DataEnvelope<AutomationRule>>(`/rules/${ruleId}/disable`);
    return unwrapData(payload);
  }
}
