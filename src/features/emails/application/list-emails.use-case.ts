import type { PaginatedResult } from "../../../shared/application/pagination";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { EmailMessage } from "../domain/email-message.entity";
import type { EmailMessageRepository, EmailQueryParams } from "../domain/email-message.repository";

export type ListEmailsInput = Omit<EmailQueryParams, "workspaceId">;

export class ListEmailsUseCase {
  public constructor(private readonly emails: EmailMessageRepository) {}

  public async execute(
    context: AuthenticatedContext,
    input: ListEmailsInput,
  ): Promise<PaginatedResult<EmailMessage>> {
    return this.emails.findByWorkspace({
      ...input,
      workspaceId: context.workspaceId,
    });
  }
}

