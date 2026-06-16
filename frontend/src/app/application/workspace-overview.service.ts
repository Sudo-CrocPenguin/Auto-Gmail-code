import type { AlertRepository } from "../../features/alerts/application/alert.repository";
import type { WorkspaceAlert } from "../../features/alerts/domain/workspace-alert.entity";
import type { AnalyticsRepository } from "../../features/analytics/application/analytics.repository";
import type {
  AnalyticsSummary,
  CategoryDistribution,
  EmailsByDay,
  TopSender,
} from "../../features/analytics/domain/analytics.entity";
import type { EmailRepository } from "../../features/emails/application/email.repository";
import type { EmailSummary } from "../../features/emails/domain/email-message.entity";
import type { GmailAccountRepository } from "../../features/gmail/application/gmail-account.repository";
import type { GmailAccount } from "../../features/gmail/domain/gmail-account.entity";
import type { RuleRepository } from "../../features/rules/application/rule.repository";
import type { AutomationRule } from "../../features/rules/domain/automation-rule.entity";
import type { SettingsRepository } from "../../features/settings/application/settings.repository";
import type { WorkspaceSettings } from "../../features/settings/domain/workspace-settings.entity";

export interface WorkspaceOverview {
  accounts: GmailAccount[];
  alerts: WorkspaceAlert[];
  categories: CategoryDistribution[];
  emails: EmailSummary[];
  emailsByDay: EmailsByDay[];
  rules: AutomationRule[];
  settings: WorkspaceSettings | null;
  summary: AnalyticsSummary;
  topSenders: TopSender[];
}

export class WorkspaceOverviewService {
  private readonly analyticsRepository: AnalyticsRepository;
  private readonly gmailRepository: GmailAccountRepository;
  private readonly emailRepository: EmailRepository;
  private readonly alertRepository: AlertRepository;
  private readonly ruleRepository: RuleRepository;
  private readonly settingsRepository: SettingsRepository;

  public constructor(
    analyticsRepository: AnalyticsRepository,
    gmailRepository: GmailAccountRepository,
    emailRepository: EmailRepository,
    alertRepository: AlertRepository,
    ruleRepository: RuleRepository,
    settingsRepository: SettingsRepository
  ) {
    this.analyticsRepository = analyticsRepository;
    this.gmailRepository = gmailRepository;
    this.emailRepository = emailRepository;
    this.alertRepository = alertRepository;
    this.ruleRepository = ruleRepository;
    this.settingsRepository = settingsRepository;
  }

  public async load(): Promise<WorkspaceOverview> {
    const [summary, accounts, emails, alerts, rules, categories, emailsByDay, topSenders, settings] =
      await Promise.all([
        this.analyticsRepository.getSummary(),
        this.gmailRepository.list(),
        this.emailRepository.listRecent(),
        this.alertRepository.listOpen(),
        this.ruleRepository.list(),
        this.analyticsRepository.getCategories(),
        this.analyticsRepository.getEmailsByDay(),
        this.analyticsRepository.getTopSenders(),
        this.settingsRepository.get(),
      ]);

    return {
      accounts,
      alerts: alerts.data,
      categories,
      emails: emails.data,
      emailsByDay,
      rules: rules.data,
      settings,
      summary,
      topSenders,
    };
  }
}
