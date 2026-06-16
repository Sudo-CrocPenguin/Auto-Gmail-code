import { compare } from "bcryptjs";
import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { WorkspaceRepository } from "../../workspace/domain/workspace.repository";
import type { Workspace } from "../../workspace/domain/workspace.entity";
import { AppError } from "../../../shared/domain/errors/app-error";
import { JwtService } from "../../../shared/infrastructure/security/jwt.service";
import { resolveSessionExpiresAt } from "./session-expiration";
import type { AppSessionRepository } from "../domain/app-session.repository";
import type { PublicUser } from "../domain/user.entity";
import { toPublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

export interface LoginUserInput {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}

export interface LoginUserOutput {
  accessToken: string;
  user: PublicUser;
  workspace: Workspace;
}

export class LoginUserUseCase {
  public constructor(
    private readonly users: UserRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly appSessions: AppSessionRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new AppError("Credenciales invalidas.", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("Credenciales invalidas.", 401, "INVALID_CREDENTIALS");
    }

    const workspace = await this.workspaces.findById(user.workspaceId);
    if (!workspace) {
      throw new AppError("El workspace del usuario no existe.", 409, "WORKSPACE_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const sessionId = randomUUID();
    await this.appSessions.create({
      id: sessionId,
      workspaceId: workspace.id,
      userId: user.id,
      role: user.role,
      createdAt: now,
      expiresAt: resolveSessionExpiresAt(new Date(now)),
      revokedAt: null,
      lastUsedAt: null,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: workspace.id,
      userId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      description: "Usuario inicio sesion.",
      ip: input.ip,
      metadata: { sessionId },
      createdAt: now,
    });

    return {
      accessToken: this.jwtService.sign({
        sessionId,
        userId: user.id,
        workspaceId: workspace.id,
        role: user.role,
      }),
      user: toPublicUser(user),
      workspace,
    };
  }
}
