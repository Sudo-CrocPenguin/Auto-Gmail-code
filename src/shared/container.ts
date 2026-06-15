import type { Router } from "express";

import { GetAccountAnalyticsUseCase } from "../features/analytics/application/get-account-analytics.use-case";
import { GetAnalyticsSummaryUseCase } from "../features/analytics/application/get-analytics-summary.use-case";
import { GetCategoryDistributionUseCase } from "../features/analytics/application/get-category-distribution.use-case";
import { GetEmailsByDayUseCase } from "../features/analytics/application/get-emails-by-day.use-case";
import { GetTopSendersUseCase } from "../features/analytics/application/get-top-senders.use-case";
import { AnalyticsController } from "../features/analytics/presentation/http/analytics.controller";
import { createAnalyticsRouter } from "../features/analytics/presentation/http/analytics.routes";
import { GetAlertDetailUseCase } from "../features/alerts/application/get-alert-detail.use-case";
import { IgnoreAlertUseCase } from "../features/alerts/application/ignore-alert.use-case";
import { ListAlertsUseCase } from "../features/alerts/application/list-alerts.use-case";
import { ResolveAlertUseCase } from "../features/alerts/application/resolve-alert.use-case";
import { AlertController } from "../features/alerts/presentation/http/alert.controller";
import { createAlertRouter } from "../features/alerts/presentation/http/alert.routes";
import { ListAuditLogsUseCase } from "../features/audit/application/list-audit-logs.use-case";
import { AuditController } from "../features/audit/presentation/http/audit.controller";
import { createAuditRouter } from "../features/audit/presentation/http/audit.routes";
import { CorrectEmailClassificationUseCase } from "../features/emails/application/correct-email-classification.use-case";
import { GetEmailDetailUseCase } from "../features/emails/application/get-email-detail.use-case";
import { ListEmailsUseCase } from "../features/emails/application/list-emails.use-case";
import { MarkEmailImportantUseCase } from "../features/emails/application/mark-email-important.use-case";
import { MarkEmailReviewedUseCase } from "../features/emails/application/mark-email-reviewed.use-case";
import { EmailController } from "../features/emails/presentation/http/email.controller";
import { createEmailRouter } from "../features/emails/presentation/http/email.routes";
import { DisconnectGmailAccountUseCase } from "../features/gmail-accounts/application/disconnect-gmail-account.use-case";
import { GetGmailOAuthStatusUseCase } from "../features/gmail-accounts/application/get-gmail-oauth-status.use-case";
import { HandleGmailOAuthCallbackUseCase } from "../features/gmail-accounts/application/handle-gmail-oauth-callback.use-case";
import { ListGmailAccountsUseCase } from "../features/gmail-accounts/application/list-gmail-accounts.use-case";
import { ReconnectGmailAccountUseCase } from "../features/gmail-accounts/application/reconnect-gmail-account.use-case";
import { StartGmailOAuthUseCase } from "../features/gmail-accounts/application/start-gmail-oauth.use-case";
import { SyncGmailAccountUseCase } from "../features/gmail-accounts/application/sync-gmail-account.use-case";
import { GmailAccountController } from "../features/gmail-accounts/presentation/http/gmail-account.controller";
import { createGmailAccountRouter } from "../features/gmail-accounts/presentation/http/gmail-account.routes";
import { CreateRuleUseCase } from "../features/rules/application/create-rule.use-case";
import { DeleteRuleUseCase } from "../features/rules/application/delete-rule.use-case";
import { GetRuleDetailUseCase } from "../features/rules/application/get-rule-detail.use-case";
import { ListRulesUseCase } from "../features/rules/application/list-rules.use-case";
import { SetRuleEnabledUseCase } from "../features/rules/application/set-rule-enabled.use-case";
import { UpdateRuleUseCase } from "../features/rules/application/update-rule.use-case";
import { RuleController } from "../features/rules/presentation/http/rule.controller";
import { createRuleRouter } from "../features/rules/presentation/http/rule.routes";
import { GetSenderDetailUseCase } from "../features/senders/application/get-sender-detail.use-case";
import { ListSenderEmailsUseCase } from "../features/senders/application/list-sender-emails.use-case";
import { ListSendersUseCase } from "../features/senders/application/list-senders.use-case";
import { MarkSenderSuspiciousUseCase } from "../features/senders/application/mark-sender-suspicious.use-case";
import { TrustSenderUseCase } from "../features/senders/application/trust-sender.use-case";
import { SenderController } from "../features/senders/presentation/http/sender.controller";
import { createSenderRouter } from "../features/senders/presentation/http/sender.routes";
import { GetCurrentWorkspaceUseCase } from "../features/workspace/application/get-current-workspace.use-case";
import { UpdateCurrentWorkspaceUseCase } from "../features/workspace/application/update-current-workspace.use-case";
import { WorkspaceController } from "../features/workspace/presentation/http/workspace.controller";
import { createWorkspaceRouter } from "../features/workspace/presentation/http/workspace.routes";
import { GetAuthenticatedUserUseCase } from "../features/auth/application/get-authenticated-user.use-case";
import { LoginUserUseCase } from "../features/auth/application/login-user.use-case";
import { LogoutUserUseCase } from "../features/auth/application/logout-user.use-case";
import { RegisterUserUseCase } from "../features/auth/application/register-user.use-case";
import { AuthController } from "../features/auth/presentation/http/auth.controller";
import { createAuthRouter } from "../features/auth/presentation/http/auth.routes";
import { AuthMiddleware } from "./http/middlewares/auth.middleware";
import { createSeededInMemoryDatabase } from "./infrastructure/persistence/in-memory-database";
import {
  InMemoryAlertRepository,
  InMemoryAuditLogRepository,
  InMemoryAutomationRuleRepository,
  InMemoryEmailMessageRepository,
  InMemoryGmailAccountRepository,
  InMemorySenderProfileRepository,
  InMemoryUserRepository,
  InMemoryWorkspaceRepository,
} from "./infrastructure/persistence/in-memory-repositories";
import { JwtService } from "./infrastructure/security/jwt.service";

export interface ApplicationContainer {
  routes: {
    auth: Router;
    workspace: Router;
    gmail: Router;
    emails: Router;
    alerts: Router;
    senders: Router;
    rules: Router;
    analytics: Router;
    audit: Router;
  };
}

export function buildContainer(): ApplicationContainer {
  const database = createSeededInMemoryDatabase();

  const users = new InMemoryUserRepository(database);
  const workspaces = new InMemoryWorkspaceRepository(database);
  const auditLogs = new InMemoryAuditLogRepository(database);
  const gmailAccounts = new InMemoryGmailAccountRepository(database);
  const emails = new InMemoryEmailMessageRepository(database);
  const alerts = new InMemoryAlertRepository(database);
  const senders = new InMemorySenderProfileRepository(database);
  const rules = new InMemoryAutomationRuleRepository(database);
  const jwtService = new JwtService();
  const authMiddleware = new AuthMiddleware(jwtService);

  const authController = new AuthController(
    new RegisterUserUseCase(users, workspaces, auditLogs, jwtService),
    new LoginUserUseCase(users, workspaces, auditLogs, jwtService),
    new GetAuthenticatedUserUseCase(users, workspaces),
    new LogoutUserUseCase(auditLogs),
  );

  const workspaceController = new WorkspaceController(
    new GetCurrentWorkspaceUseCase(workspaces),
    new UpdateCurrentWorkspaceUseCase(workspaces, auditLogs),
  );

  const gmailAccountController = new GmailAccountController(
    new ListGmailAccountsUseCase(gmailAccounts),
    new StartGmailOAuthUseCase(auditLogs),
    new GetGmailOAuthStatusUseCase(),
    new HandleGmailOAuthCallbackUseCase(auditLogs),
    new SyncGmailAccountUseCase(gmailAccounts, auditLogs),
    new ReconnectGmailAccountUseCase(gmailAccounts, auditLogs),
    new DisconnectGmailAccountUseCase(gmailAccounts, auditLogs),
  );

  const emailController = new EmailController(
    new ListEmailsUseCase(emails),
    new GetEmailDetailUseCase(emails),
    new CorrectEmailClassificationUseCase(emails, auditLogs),
    new MarkEmailReviewedUseCase(emails, auditLogs),
    new MarkEmailImportantUseCase(emails, auditLogs),
  );

  const alertController = new AlertController(
    new ListAlertsUseCase(alerts),
    new GetAlertDetailUseCase(alerts),
    new ResolveAlertUseCase(alerts, auditLogs),
    new IgnoreAlertUseCase(alerts, auditLogs),
  );

  const senderController = new SenderController(
    new ListSendersUseCase(senders),
    new GetSenderDetailUseCase(senders),
    new TrustSenderUseCase(senders, auditLogs),
    new MarkSenderSuspiciousUseCase(senders, auditLogs),
    new ListSenderEmailsUseCase(senders, emails),
  );

  const ruleController = new RuleController(
    new ListRulesUseCase(rules),
    new GetRuleDetailUseCase(rules),
    new CreateRuleUseCase(rules, auditLogs),
    new UpdateRuleUseCase(rules, auditLogs),
    new DeleteRuleUseCase(rules, auditLogs),
    new SetRuleEnabledUseCase(rules, auditLogs),
  );

  const analyticsController = new AnalyticsController(
    new GetAnalyticsSummaryUseCase(gmailAccounts, emails, alerts),
    new GetEmailsByDayUseCase(emails),
    new GetCategoryDistributionUseCase(emails),
    new GetTopSendersUseCase(senders),
    new GetAccountAnalyticsUseCase(gmailAccounts),
  );

  const auditController = new AuditController(new ListAuditLogsUseCase(auditLogs));

  return {
    routes: {
      auth: createAuthRouter(authController, authMiddleware),
      workspace: createWorkspaceRouter(workspaceController, authMiddleware),
      gmail: createGmailAccountRouter(gmailAccountController, authMiddleware),
      emails: createEmailRouter(emailController, authMiddleware),
      alerts: createAlertRouter(alertController, authMiddleware),
      senders: createSenderRouter(senderController, authMiddleware),
      rules: createRuleRouter(ruleController, authMiddleware),
      analytics: createAnalyticsRouter(analyticsController, authMiddleware),
      audit: createAuditRouter(auditController, authMiddleware),
    },
  };
}
