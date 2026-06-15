import type { RuleAction, RuleCondition } from "../domain/automation-rule.entity";

export type RuleConditionInput = Omit<RuleCondition, "id">;
export type RuleActionInput = Omit<RuleAction, "id">;

export interface CreateRuleInput {
  name: string;
  description?: string | null | undefined;
  conditions: RuleConditionInput[];
  actions: RuleActionInput[];
  priority: number;
  enabled?: boolean | undefined;
}

export interface UpdateRuleInput {
  name?: string | undefined;
  description?: string | null | undefined;
  conditions?: RuleConditionInput[] | undefined;
  actions?: RuleActionInput[] | undefined;
  priority?: number | undefined;
  enabled?: boolean | undefined;
}

