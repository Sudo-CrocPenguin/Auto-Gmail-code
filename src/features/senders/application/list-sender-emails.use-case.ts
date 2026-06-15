import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { EmailMessage } from "../../emails/domain/email-message.entity";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";
import type { SenderProfileRepository } from "../domain/sender-profile.repository";

export interface ListSenderEmailsInput {
  page: number;
  limit: number;
}

export class ListSenderEmailsUseCase {
  public constructor(
    private readonly senders: SenderProfileRepository,
    private readonly emails: EmailMessageRepository,
  ) {}

  public async execute(
    context: AuthenticatedContext,
    senderId: string,
    input: ListSenderEmailsInput,
  ): Promise<PaginatedResult<EmailMessage>> {
    const sender = await this.senders.findById(senderId);
    if (!sender || sender.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El remitente no existe.", "SENDER_NOT_FOUND");
    }

    return this.emails.findByWorkspace({
      workspaceId: context.workspaceId,
      fromEmail: sender.email,
      page: input.page,
      limit: input.limit,
      sortBy: "receivedAt",
      sortOrder: "desc",
    });
  }
}

