import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { SenderProfile } from "../domain/sender-profile.entity";
import type { SenderProfileRepository, SenderQueryParams } from "../domain/sender-profile.repository";

export type ListSendersInput = Omit<SenderQueryParams, "workspaceId">;

export class ListSendersUseCase {
  public constructor(private readonly senders: SenderProfileRepository) {}

  public async execute(
    context: AuthenticatedContext,
    input: ListSendersInput,
  ): Promise<PaginatedResult<SenderProfile>> {
    return this.senders.findByWorkspace({
      ...input,
      workspaceId: context.workspaceId,
    });
  }
}

