import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { AlertRepository } from "../../alerts/domain/alert.repository";
import type { EmailMessageRepository } from "../../emails/domain/email-message.repository";
import type { GmailAccountRepository } from "../../gmail-accounts/domain/gmail-account.repository";

export class GetAnalyticsSummaryUseCase {
  public constructor(
    private readonly gmailAccounts: GmailAccountRepository,
    private readonly emails: EmailMessageRepository,
    private readonly alerts: AlertRepository,
  ) {}

  public async execute(context: AuthenticatedContext) {
    const [accounts, emailResult, alertResult] = await Promise.all([
      this.gmailAccounts.findByWorkspaceId(context.workspaceId),
      this.emails.findByWorkspace({ workspaceId: context.workspaceId, page: 1, limit: 100 }),
      this.alerts.findByWorkspace({ workspaceId: context.workspaceId, page: 1, limit: 100 }),
    ]);

    const emails = emailResult.data;
    const alerts = alertResult.data;

    return {
      connectedAccounts: accounts.filter((account) => account.status === "CONNECTED").length,
      totalAccounts: accounts.length,
      totalEmails: emails.length,
      importantEmails: emails.filter((email) => email.isImportant).length,
      probableSpam: emails.filter((email) => email.isSpam || email.classification?.primaryCategory === "SPAM_PROBABLE").length,
      pendingReview: emails.filter((email) => email.classification?.actionRequired && !email.reviewedAt).length,
      securityAlerts: alerts.filter((alert) => alert.type.startsWith("SECURITY")).length,
      unresolvedAlerts: alerts.filter((alert) => alert.status === "NEW" || alert.status === "SEEN").length,
      lastSyncAt:
        accounts
          .map((account) => account.lastSyncAt)
          .filter((date): date is string => Boolean(date))
          .sort()
          .at(-1) ?? null,
    };
  }
}

