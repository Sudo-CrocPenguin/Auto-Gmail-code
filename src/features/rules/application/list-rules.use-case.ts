import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { AutomationRule } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository, RuleQueryParams } from "../domain/automation-rule.repository";

export type ListRulesInput = Omit<RuleQueryParams, "workspaceId">;

export class ListRulesUseCase {
  public constructor(private readonly rules: AutomationRuleRepository) {}

  public async execute(
    context: AuthenticatedContext,
    input: ListRulesInput,
  ): Promise<PaginatedResult<AutomationRule>> {
    return this.rules.findByWorkspace({
      ...input,
      workspaceId: context.workspaceId,
    });
  }
}

