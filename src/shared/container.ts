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
import { GmailSyncService } from "../features/gmail-accounts/application/gmail-sync.service";
import { HandleGmailOAuthCallbackUseCase } from "../features/gmail-accounts/application/handle-gmail-oauth-callback.use-case";
import { ListGmailAccountsUseCase } from "../features/gmail-accounts/application/list-gmail-accounts.use-case";
import { OAuthStateService } from "../features/gmail-accounts/application/oauth-state.service";
import { ReconnectGmailAccountUseCase } from "../features/gmail-accounts/application/reconnect-gmail-account.use-case";
import { StartGmailOAuthUseCase } from "../features/gmail-accounts/application/start-gmail-oauth.use-case";
import { SyncGmailAccountUseCase } from "../features/gmail-accounts/application/sync-gmail-account.use-case";
import { GmailTokenVault } from "../features/gmail-accounts/infrastructure/gmail-token-vault";
import { GoogleGmailClient } from "../features/gmail-accounts/infrastructure/google-gmail.client";
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
import { GetWorkspaceSettingsUseCase } from "../features/settings/application/get-workspace-settings.use-case";
import { UpdateWorkspaceSettingsUseCase } from "../features/settings/application/update-workspace-settings.use-case";
import { SettingsController } from "../features/settings/presentation/http/settings.controller";
import { createSettingsRouter } from "../features/settings/presentation/http/settings.routes";
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
import { environment } from "./config/environment";
import { AppError } from "./domain/errors/app-error";
import { AuthMiddleware } from "./http/middlewares/auth.middleware";
import { RateLimitMiddleware } from "./http/middlewares/rate-limit.middleware";
import { createSeededInMemoryDatabase } from "./infrastructure/persistence/in-memory-database";
import {
  InMemoryAlertRepository,
  InMemoryAuditLogRepository,
  InMemoryAutomationRuleRepository,
  InMemoryEmailMessageRepository,
  InMemoryGmailAccountRepository,
  InMemoryGmailOAuthTokenRepository,
  InMemorySenderProfileRepository,
  InMemoryWorkspaceSettingsRepository,
  InMemoryUserRepository,
  InMemoryWorkspaceRepository,
} from "./infrastructure/persistence/in-memory-repositories";
import { prisma } from "./infrastructure/persistence/prisma.client";
import {
  PrismaAlertRepository,
  PrismaAuditLogRepository,
  PrismaAutomationRuleRepository,
  PrismaEmailMessageRepository,
  PrismaGmailAccountRepository,
  PrismaGmailOAuthTokenRepository,
  PrismaSenderProfileRepository,
  PrismaWorkspaceSettingsRepository,
  PrismaUserRepository,
  PrismaWorkspaceRepository,
} from "./infrastructure/persistence/prisma-repositories";
import { JwtService } from "./infrastructure/security/jwt.service";
import { TokenEncryptionService } from "./infrastructure/security/token-encryption.service";

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
    settings: Router;
  };
}

export function buildContainer(): ApplicationContainer {
  const repositories = buildRepositories();

  const users = repositories.users;
  const workspaces = repositories.workspaces;
  const auditLogs = repositories.auditLogs;
  const gmailAccounts = repositories.gmailAccounts;
  const gmailOAuthTokens = repositories.gmailOAuthTokens;
  const emails = repositories.emails;
  const alerts = repositories.alerts;
  const senders = repositories.senders;
  const rules = repositories.rules;
  const settings = repositories.settings;

  const jwtService = new JwtService();
  const tokenEncryptionService = new TokenEncryptionService();
  const oauthStateService = new OAuthStateService();
  const gmailTokenVault = new GmailTokenVault(gmailOAuthTokens, tokenEncryptionService);
  const googleGmailClient = new GoogleGmailClient();
  const gmailSyncService = new GmailSyncService(
    gmailAccounts,
    emails,
    alerts,
    senders,
    auditLogs,
    gmailTokenVault,
    googleGmailClient,
  );
  const authMiddleware = new AuthMiddleware(jwtService);
  const authRateLimit = new RateLimitMiddleware({
    ...environment.rateLimit.auth,
    keyPrefix: "auth",
  });
  const gmailRateLimit = new RateLimitMiddleware({
    ...environment.rateLimit.gmail,
    keyPrefix: "gmail",
    keyGenerator: (request) => request.auth?.workspaceId ?? request.ip ?? "unknown",
  });
  const syncRateLimit = new RateLimitMiddleware({
    ...environment.rateLimit.sync,
    keyPrefix: "gmail-sync",
    keyGenerator: (request) => request.auth?.workspaceId ?? request.ip ?? "unknown",
  });

  return composeApplication({
    users,
    workspaces,
    auditLogs,
    gmailAccounts,
    emails,
    alerts,
    senders,
    rules,
    settings,
    jwtService,
    authMiddleware,
    authRateLimit,
    gmailRateLimit,
    syncRateLimit,
    gmailTokenVault,
    googleGmailClient,
    gmailSyncService,
    oauthStateService,
  });
}

function buildRepositories() {
  if (environment.persistenceDriver === "prisma") {
    if (!environment.databaseUrl) {
      throw new AppError("DATABASE_URL es obligatorio cuando PERSISTENCE_DRIVER=prisma.", 500, "DATABASE_URL_REQUIRED");
    }

    return {
      users: new PrismaUserRepository(prisma),
      workspaces: new PrismaWorkspaceRepository(prisma),
      auditLogs: new PrismaAuditLogRepository(prisma),
      gmailAccounts: new PrismaGmailAccountRepository(prisma),
      gmailOAuthTokens: new PrismaGmailOAuthTokenRepository(prisma),
      emails: new PrismaEmailMessageRepository(prisma),
      alerts: new PrismaAlertRepository(prisma),
      senders: new PrismaSenderProfileRepository(prisma),
      rules: new PrismaAutomationRuleRepository(prisma),
      settings: new PrismaWorkspaceSettingsRepository(prisma),
    };
  }

  const database = createSeededInMemoryDatabase();

  return {
    users: new InMemoryUserRepository(database),
    workspaces: new InMemoryWorkspaceRepository(database),
    auditLogs: new InMemoryAuditLogRepository(database),
    gmailAccounts: new InMemoryGmailAccountRepository(database),
    gmailOAuthTokens: new InMemoryGmailOAuthTokenRepository(database),
    emails: new InMemoryEmailMessageRepository(database),
    alerts: new InMemoryAlertRepository(database),
    senders: new InMemorySenderProfileRepository(database),
    rules: new InMemoryAutomationRuleRepository(database),
    settings: new InMemoryWorkspaceSettingsRepository(database),
  };
}

interface ComposedApplicationDependencies {
  users: InMemoryUserRepository | PrismaUserRepository;
  workspaces: InMemoryWorkspaceRepository | PrismaWorkspaceRepository;
  auditLogs: InMemoryAuditLogRepository | PrismaAuditLogRepository;
  gmailAccounts: InMemoryGmailAccountRepository | PrismaGmailAccountRepository;
  emails: InMemoryEmailMessageRepository | PrismaEmailMessageRepository;
  alerts: InMemoryAlertRepository | PrismaAlertRepository;
  senders: InMemorySenderProfileRepository | PrismaSenderProfileRepository;
  rules: InMemoryAutomationRuleRepository | PrismaAutomationRuleRepository;
  settings: InMemoryWorkspaceSettingsRepository | PrismaWorkspaceSettingsRepository;
  jwtService: JwtService;
  authMiddleware: AuthMiddleware;
  authRateLimit: RateLimitMiddleware;
  gmailRateLimit: RateLimitMiddleware;
  syncRateLimit: RateLimitMiddleware;
  gmailTokenVault: GmailTokenVault;
  googleGmailClient: GoogleGmailClient;
  gmailSyncService: GmailSyncService;
  oauthStateService: OAuthStateService;
}

function composeApplication(dependencies: ComposedApplicationDependencies): ApplicationContainer {
  const authController = new AuthController(
    new RegisterUserUseCase(dependencies.users, dependencies.workspaces, dependencies.auditLogs, dependencies.jwtService),
    new LoginUserUseCase(dependencies.users, dependencies.workspaces, dependencies.auditLogs, dependencies.jwtService),
    new GetAuthenticatedUserUseCase(dependencies.users, dependencies.workspaces),
    new LogoutUserUseCase(dependencies.auditLogs),
  );

  const workspaceController = new WorkspaceController(
    new GetCurrentWorkspaceUseCase(dependencies.workspaces),
    new UpdateCurrentWorkspaceUseCase(dependencies.workspaces, dependencies.auditLogs),
  );

  const gmailAccountController = new GmailAccountController(
    new ListGmailAccountsUseCase(dependencies.gmailAccounts),
    new StartGmailOAuthUseCase(
      dependencies.auditLogs,
      dependencies.googleGmailClient,
      dependencies.oauthStateService,
    ),
    new GetGmailOAuthStatusUseCase(),
    new HandleGmailOAuthCallbackUseCase(
      dependencies.auditLogs,
      dependencies.gmailAccounts,
      dependencies.gmailTokenVault,
      dependencies.googleGmailClient,
      dependencies.gmailSyncService,
      dependencies.oauthStateService,
    ),
    new SyncGmailAccountUseCase(dependencies.gmailAccounts, dependencies.auditLogs, dependencies.gmailSyncService),
    new ReconnectGmailAccountUseCase(
      dependencies.gmailAccounts,
      dependencies.auditLogs,
      dependencies.googleGmailClient,
      dependencies.oauthStateService,
    ),
    new DisconnectGmailAccountUseCase(dependencies.gmailAccounts, dependencies.auditLogs, dependencies.gmailTokenVault),
  );

  const emailController = new EmailController(
    new ListEmailsUseCase(dependencies.emails),
    new GetEmailDetailUseCase(dependencies.emails),
    new CorrectEmailClassificationUseCase(dependencies.emails, dependencies.auditLogs),
    new MarkEmailReviewedUseCase(dependencies.emails, dependencies.auditLogs),
    new MarkEmailImportantUseCase(dependencies.emails, dependencies.auditLogs),
  );

  const alertController = new AlertController(
    new ListAlertsUseCase(dependencies.alerts),
    new GetAlertDetailUseCase(dependencies.alerts),
    new ResolveAlertUseCase(dependencies.alerts, dependencies.auditLogs),
    new IgnoreAlertUseCase(dependencies.alerts, dependencies.auditLogs),
  );

  const senderController = new SenderController(
    new ListSendersUseCase(dependencies.senders),
    new GetSenderDetailUseCase(dependencies.senders),
    new TrustSenderUseCase(dependencies.senders, dependencies.auditLogs),
    new MarkSenderSuspiciousUseCase(dependencies.senders, dependencies.auditLogs),
    new ListSenderEmailsUseCase(dependencies.senders, dependencies.emails),
  );

  const ruleController = new RuleController(
    new ListRulesUseCase(dependencies.rules),
    new GetRuleDetailUseCase(dependencies.rules),
    new CreateRuleUseCase(dependencies.rules, dependencies.auditLogs),
    new UpdateRuleUseCase(dependencies.rules, dependencies.auditLogs),
    new DeleteRuleUseCase(dependencies.rules, dependencies.auditLogs),
    new SetRuleEnabledUseCase(dependencies.rules, dependencies.auditLogs),
  );

  const analyticsController = new AnalyticsController(
    new GetAnalyticsSummaryUseCase(dependencies.gmailAccounts, dependencies.emails, dependencies.alerts),
    new GetEmailsByDayUseCase(dependencies.emails),
    new GetCategoryDistributionUseCase(dependencies.emails),
    new GetTopSendersUseCase(dependencies.senders),
    new GetAccountAnalyticsUseCase(dependencies.gmailAccounts),
  );

  const auditController = new AuditController(new ListAuditLogsUseCase(dependencies.auditLogs));
  const settingsController = new SettingsController(
    new GetWorkspaceSettingsUseCase(dependencies.settings),
    new UpdateWorkspaceSettingsUseCase(dependencies.settings, dependencies.auditLogs),
  );

  return {
    routes: {
      auth: createAuthRouter(authController, dependencies.authMiddleware, dependencies.authRateLimit),
      workspace: createWorkspaceRouter(workspaceController, dependencies.authMiddleware),
      gmail: createGmailAccountRouter(
        gmailAccountController,
        dependencies.authMiddleware,
        dependencies.gmailRateLimit,
        dependencies.syncRateLimit,
      ),
      emails: createEmailRouter(emailController, dependencies.authMiddleware),
      alerts: createAlertRouter(alertController, dependencies.authMiddleware),
      senders: createSenderRouter(senderController, dependencies.authMiddleware),
      rules: createRuleRouter(ruleController, dependencies.authMiddleware),
      analytics: createAnalyticsRouter(analyticsController, dependencies.authMiddleware),
      audit: createAuditRouter(auditController, dependencies.authMiddleware),
      settings: createSettingsRouter(settingsController, dependencies.authMiddleware),
    },
  };
}
