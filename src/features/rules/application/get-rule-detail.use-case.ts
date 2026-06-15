import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { AutomationRule } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";

export class GetRuleDetailUseCase {
  public constructor(private readonly rules: AutomationRuleRepository) {}

  public async execute(context: AuthenticatedContext, ruleId: string): Promise<AutomationRule> {
    const rule = await this.rules.findById(ruleId);
    if (!rule || rule.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    return rule;
  }
}

