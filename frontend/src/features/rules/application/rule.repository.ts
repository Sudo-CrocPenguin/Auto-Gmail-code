import type { PaginatedResponse } from "../../../shared/domain/api-response";
import type { AutomationRule } from "../domain/automation-rule.entity";

export interface RuleRepository {
  list(): Promise<PaginatedResponse<AutomationRule>>;
}
