import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { Alert } from "../domain/alert.entity";
import type { AlertQueryParams, AlertRepository } from "../domain/alert.repository";

export type ListAlertsInput = Omit<AlertQueryParams, "workspaceId">;

export class ListAlertsUseCase {
  public constructor(private readonly alerts: AlertRepository) {}

  public async execute(
    context: AuthenticatedContext,
    input: ListAlertsInput,
  ): Promise<PaginatedResult<Alert>> {
    return this.alerts.findByWorkspace({
      ...input,
      workspaceId: context.workspaceId,
    });
  }
}

