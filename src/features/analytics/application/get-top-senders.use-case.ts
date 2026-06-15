import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { SenderProfileRepository } from "../../senders/domain/sender-profile.repository";

export class GetTopSendersUseCase {
  public constructor(private readonly senders: SenderProfileRepository) {}

  public async execute(context: AuthenticatedContext) {
    const result = await this.senders.findByWorkspace({
      workspaceId: context.workspaceId,
      page: 1,
      limit: 10,
    });

    return result.data;
  }
}

