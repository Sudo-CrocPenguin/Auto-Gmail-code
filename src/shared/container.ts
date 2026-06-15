import type { Router } from "express";

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
  InMemoryUserRepository,
  InMemoryWorkspaceRepository,
} from "./infrastructure/persistence/in-memory-repositories";
import { JwtService } from "./infrastructure/security/jwt.service";

export interface ApplicationContainer {
  routes: {
    auth: Router;
    workspace: Router;
  };
}

export function buildContainer(): ApplicationContainer {
  const database = createSeededInMemoryDatabase();

  const users = new InMemoryUserRepository(database);
  const workspaces = new InMemoryWorkspaceRepository(database);
  const auditLogs = new InMemoryAuditLogRepository(database);
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

  return {
    routes: {
      auth: createAuthRouter(authController, authMiddleware),
      workspace: createWorkspaceRouter(workspaceController, authMiddleware),
    },
  };
}

