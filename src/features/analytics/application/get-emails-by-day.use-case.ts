import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";

export class GetEmailsByDayUseCase {
  public constructor(private readonly emails: EmailMessageRepository) {}

  public async execute(context: AuthenticatedContext) {
    const result = await this.emails.findByWorkspace({
      workspaceId: context.workspaceId,
      page: 1,
      limit: 100,
      sortBy: "receivedAt",
      sortOrder: "asc",
    });

    const grouped = new Map<string, number>();
    for (const email of result.data) {
      const day = email.receivedAt.slice(0, 10);
      grouped.set(day, (grouped.get(day) ?? 0) + 1);
    }

    return Array.from(grouped.entries()).map(([date, count]) => ({ date, count }));
  }
}

