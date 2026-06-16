import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { AutomationRule, CreateAutomationRuleInput } from "../domain/automation-rule.entity";

export interface RuleRepository {
  list(): Promise<PaginatedResponse<AutomationRule>>;
  create(input: CreateAutomationRuleInput): Promise<AutomationRule>;
  enable(ruleId: string): Promise<AutomationRule>;
  disable(ruleId: string): Promise<AutomationRule>;
}
