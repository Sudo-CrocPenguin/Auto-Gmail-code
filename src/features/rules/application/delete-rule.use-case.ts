import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { AutomationRuleRepository } from "../domain/automation-rule.repository";

export class DeleteRuleUseCase {
  public constructor(
    private readonly rules: AutomationRuleRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, ruleId: string): Promise<void> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden eliminar reglas.");

    const rule = await this.rules.findById(ruleId);
    if (!rule || rule.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La regla no existe.", "RULE_NOT_FOUND");
    }

    await this.rules.delete(rule.id);
    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "RULE_DELETED",
      entityType: "AutomationRule",
      entityId: rule.id,
      description: `Regla eliminada: ${rule.name}.`,
      ip: null,
      metadata: {},
      createdAt: new Date().toISOString(),
    });
  }
}

