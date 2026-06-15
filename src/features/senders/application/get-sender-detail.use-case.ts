import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { SenderProfile } from "../domain/sender-profile.entity";
import type { SenderProfileRepository } from "../domain/sender-profile.repository";

export class GetSenderDetailUseCase {
  public constructor(private readonly senders: SenderProfileRepository) {}

  public async execute(context: AuthenticatedContext, senderId: string): Promise<SenderProfile> {
    const sender = await this.senders.findById(senderId);
    if (!sender || sender.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El remitente no existe.", "SENDER_NOT_FOUND");
    }

    return sender;
  }
}

