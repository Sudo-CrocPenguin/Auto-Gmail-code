import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { AutomationRule } from "./automation-rule.entity";

export interface RuleQueryParams extends PaginationParams {
  workspaceId: string;
  enabled?: boolean;
  search?: string;
}

export interface AutomationRuleRepository {
  create(rule: AutomationRule): Promise<AutomationRule>;
  findById(id: string): Promise<AutomationRule | null>;
  findByWorkspace(params: RuleQueryParams): Promise<PaginatedResult<AutomationRule>>;
  update(id: string, data: Partial<AutomationRule>): Promise<AutomationRule | null>;
  delete(id: string): Promise<boolean>;
}

