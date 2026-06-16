import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { Alert } from "../domain/alert.entity";
import type { AlertRepository } from "../domain/alert.repository";

export class ResolveAlertUseCase {
  public constructor(
    private readonly alerts: AlertRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  public async execute(context: AuthenticatedContext, alertId: string): Promise<Alert> {
    const alert = await this.alerts.findById(alertId);
    if (!alert || alert.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La alerta no existe.", "ALERT_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updatedAlert = await this.alerts.update(alert.id, {
      status: "RESOLVED",
      resolvedAt: now,
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "ALERT_RESOLVED",
      entityType: "Alert",
      entityId: alert.id,
      description: `Usuario resolvio alerta: ${alert.title}.`,
      ip: null,
      metadata: { previousStatus: alert.status },
      createdAt: now,
    });

    if (!updatedAlert) {
      throw new NotFoundError("La alerta no existe.", "ALERT_NOT_FOUND");
    }

    return updatedAlert;
  }
}

