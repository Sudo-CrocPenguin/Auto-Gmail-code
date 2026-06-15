import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { Alert } from "../domain/alert.entity";
import type { AlertRepository } from "../domain/alert.repository";

export class GetAlertDetailUseCase {
  public constructor(private readonly alerts: AlertRepository) {}

  public async execute(context: AuthenticatedContext, alertId: string): Promise<Alert> {
    const alert = await this.alerts.findById(alertId);
    if (!alert || alert.workspaceId !== context.workspaceId) {
      throw new NotFoundError("La alerta no existe.", "ALERT_NOT_FOUND");
    }

    return alert;
  }
}

