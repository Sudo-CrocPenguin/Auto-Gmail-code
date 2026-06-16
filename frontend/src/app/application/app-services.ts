import { AlertApiRepository } from "../../features/alerts/infrastructure/alert-api.repository";
import { AnalyticsApiRepository } from "../../features/analytics/infrastructure/analytics-api.repository";
import { LoginUserUseCase } from "../../features/auth/application/login-user.use-case";
import { LogoutUserUseCase } from "../../features/auth/application/logout-user.use-case";
import { AuthApiRepository } from "../../features/auth/infrastructure/auth-api.repository";
import { EmailApiRepository } from "../../features/emails/infrastructure/email-api.repository";
import { GmailAccountApiRepository } from "../../features/gmail/infrastructure/gmail-account-api.repository";
import { RuleApiRepository } from "../../features/rules/infrastructure/rule-api.repository";
import { SettingsApiRepository } from "../../features/settings/infrastructure/settings-api.repository";
import { runtimeConfig } from "../../shared/infrastructure/config/runtime-config";
import { HttpClient } from "../../shared/infrastructure/http/http-client";
import { BrowserTokenStorage } from "../../shared/infrastructure/storage/browser-token-storage";
import { WorkspaceOverviewService } from "./workspace-overview.service";

export interface AppServices {
  alertRepository: AlertApiRepository;
  apiBaseUrl: string;
  authRepository: AuthApiRepository;
  emailRepository: EmailApiRepository;
  gmailRepository: GmailAccountApiRepository;
  loginUser: LoginUserUseCase;
  logoutUser: LogoutUserUseCase;
  overview: WorkspaceOverviewService;
  ruleRepository: RuleApiRepository;
  tokenStorage: BrowserTokenStorage;
}

export function createAppServices(): AppServices {
  const tokenStorage = new BrowserTokenStorage();
  const httpClient = new HttpClient(runtimeConfig.apiBaseUrl, () => tokenStorage.read());
  const authRepository = new AuthApiRepository(httpClient);
  const analyticsRepository = new AnalyticsApiRepository(httpClient);
  const gmailRepository = new GmailAccountApiRepository(httpClient);
  const emailRepository = new EmailApiRepository(httpClient);
  const alertRepository = new AlertApiRepository(httpClient);
  const ruleRepository = new RuleApiRepository(httpClient);
  const settingsRepository = new SettingsApiRepository(httpClient);

  return {
    alertRepository,
    apiBaseUrl: runtimeConfig.apiBaseUrl,
    authRepository,
    emailRepository,
    gmailRepository,
    loginUser: new LoginUserUseCase(authRepository),
    logoutUser: new LogoutUserUseCase(authRepository),
    overview: new WorkspaceOverviewService(
      analyticsRepository,
      gmailRepository,
      emailRepository,
      alertRepository,
      ruleRepository,
      settingsRepository
    ),
    ruleRepository,
    tokenStorage,
  };
}
