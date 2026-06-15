import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { emailCategories } from "../../emails/domain/email-category";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";

export class GetCategoryDistributionUseCase {
  public constructor(private readonly emails: EmailMessageRepository) {}

  public async execute(context: AuthenticatedContext) {
    const result = await this.emails.findByWorkspace({
      workspaceId: context.workspaceId,
      page: 1,
      limit: 100,
    });

    return emailCategories.map((category) => ({
      category,
      count: result.data.filter((email) => email.classification?.primaryCategory === category).length,
    }));
  }
}

