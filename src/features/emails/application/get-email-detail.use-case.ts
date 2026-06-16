import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { EmailMessage } from "../domain/email-message.entity";
import type { EmailMessageRepository } from "../domain/email-message.repository";

export class GetEmailDetailUseCase {
  public constructor(private readonly emails: EmailMessageRepository) {}

  public async execute(context: AuthenticatedContext, emailId: string): Promise<EmailMessage> {
    const email = await this.emails.findById(emailId);
    if (!email || email.workspaceId !== context.workspaceId) {
      throw new NotFoundError("El correo no existe.", "EMAIL_NOT_FOUND");
    }

    return email;
  }
}

