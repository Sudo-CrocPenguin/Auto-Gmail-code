import type { Router } from "express";

import { CorrectEmailClassificationUseCase } from "../features/emails/application/correct-email-classification.use-case";
import { GetEmailDetailUseCase } from "../features/emails/application/get-email-detail.use-case";
import { ListEmailsUseCase } from "../features/emails/application/list-emails.use-case";
import { MarkEmailImportantUseCase } from "../features/emails/application/mark-email-important.use-case";
import { MarkEmailReviewedUseCase } from "../features/emails/application/mark-email-reviewed.use-case";
import { EmailController } from "../features/emails/presentation/http/email.controller";
import { createEmailRouter } from "../features/emails/presentation/http/email.routes";
import { DisconnectGmailAccountUseCase } from "../features/gmail-accounts/application/disconnect-gmail-account.use-case";
import { GetGmailOAuthStatusUseCase } from "../features/gmail-accounts/application/get-gmail-oauth-status.use-case";
import { ListGmailAccountsUseCase } from "../features/gmail-accounts/application/list-gmail-accounts.use-case";
import { ReconnectGmailAccountUseCase } from "../features/gmail-accounts/application/reconnect-gmail-account.use-case";
import { StartGmailOAuthUseCase } from "../features/gmail-accounts/application/start-gmail-oauth.use-case";
import { SyncGmailAccountUseCase } from "../features/gmail-accounts/application/sync-gmail-account.use-case";
import { GmailAccountController } from "../features/gmail-accounts/presentation/http/gmail-account.controller";
import { createGmailAccountRouter } from "../features/gmail-accounts/presentation/http/gmail-account.routes";
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
  InMemoryAuditLogRepository,
  InMemoryEmailMessageRepository,
  InMemoryGmailAccountRepository,
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
  };
}

export function buildContainer(): ApplicationContainer {
  const database = createSeededInMemoryDatabase();

  const users = new InMemoryUserRepository(database);
  const workspaces = new InMemoryWorkspaceRepository(database);
  const auditLogs = new InMemoryAuditLogRepository(database);
  const gmailAccounts = new InMemoryGmailAccountRepository(database);
  const emails = new InMemoryEmailMessageRepository(database);
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

  return {
    routes: {
      auth: createAuthRouter(authController, authMiddleware),
      workspace: createWorkspaceRouter(workspaceController, authMiddleware),
      gmail: createGmailAccountRouter(gmailAccountController, authMiddleware),
      emails: createEmailRouter(emailController, authMiddleware),
    },
  };
}
