import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { AutomationRule } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";
import type { UpdateRuleInput } from "./rule-inputs";
import { mapAction, mapCondition } from "./create-rule.use-case";

export class UpdateRuleUseCase {
  public constructor(
    private readonly rules: AutomationRuleRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    ruleId: string,
    input: UpdateRuleInput,
  ): Promise<AutomationRule> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden editar reglas.");

    const rule = await this.rules.findById(ruleId);
    if (!rule || rule.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    const updateData: Partial<AutomationRule> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.conditions !== undefined) updateData.conditions = input.conditions.map(mapCondition);
    if (input.actions !== undefined) updateData.actions = input.actions.map(mapAction);
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.enabled !== undefined) updateData.enabled = input.enabled;

    const updatedRule = await this.rules.update(rule.id, updateData);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "RULE_UPDATED",
      entityType: "AutomationRule",
      entityId: rule.id,
      description: `Regla actualizada: ${rule.name}.`,
      ip: null,
      metadata: { updatedFields: Object.keys(updateData) },
      createdAt: new Date().toISOString(),
    });

    if (!updatedRule) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    return updatedRule;
  }
}

