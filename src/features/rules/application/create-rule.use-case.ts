import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { AutomationRule, RuleAction, RuleCondition } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";
import type { CreateRuleInput, RuleActionInput, RuleConditionInput } from "./rule-inputs";

export class CreateRuleUseCase {
  public constructor(
    private readonly rules: AutomationRuleRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, input: CreateRuleInput): Promise<AutomationRule> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden crear reglas.");

    const now = new Date().toISOString();
    const rule: AutomationRule = {
      id: randomUUID(),
      workspaceId: context.workspaceId,
      name: input.name,
      description: input.description ?? null,
      conditions: input.conditions.map(mapCondition),
      actions: input.actions.map(mapAction),
      priority: input.priority,
      enabled: input.enabled ?? true,
      timesApplied: 0,
      createdAt: now,
      updatedAt: now,
    };

    const createdRule = await this.rules.create(rule);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "RULE_CREATED",
      entityType: "AutomationRule",
      entityId: createdRule.id,
      description: `Regla creada: ${createdRule.name}.`,
      ip: null,
      metadata: { priority: createdRule.priority, enabled: createdRule.enabled },
      createdAt: now,
    });

    return createdRule;
  }
}

export function mapCondition(input: RuleConditionInput): RuleCondition {
  return {
    id: randomUUID(),
    ...input,
  };
}

export function mapAction(input: RuleActionInput): RuleAction {
  return {
    id: randomUUID(),
    ...input,
  };
}

