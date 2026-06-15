import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { AutomationRule } from "../domain/automation-rule.entity";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";

export class SetRuleEnabledUseCase {
  public constructor(
    private readonly rules: AutomationRuleRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    ruleId: string,
    enabled: boolean,
  ): Promise<AutomationRule> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden cambiar reglas.");

    const rule = await this.rules.findById(ruleId);
    if (!rule || rule.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    const updatedRule = await this.rules.update(rule.id, {
      enabled,
      updatedAt: new Date().toISOString(),
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: enabled ? "RULE_ENABLED" : "RULE_DISABLED",
      entityType: "AutomationRule",
      entityId: rule.id,
      description: `Regla ${enabled ? "activada" : "desactivada"}: ${rule.name}.`,
      ip: null,
      metadata: { previousEnabled: rule.enabled },
      createdAt: new Date().toISOString(),
    });

    if (!updatedRule) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    return updatedRule;
  }
}

