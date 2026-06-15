import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import type { WorkspaceRepository } from "../../workspace/domain/workspace.repository";
import type { Workspace } from "../../workspace/domain/workspace.entity";
import { AppError } from "../../../shared/domain/errors/app-error";
import { JwtService } from "../../../shared/infrastructure/security/jwt.service";
import type { PublicUser, User } from "../domain/user.entity";
import { toPublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

export interface RegisterUserOutput {
  accessToken: string;
  user: PublicUser;
  workspace: Workspace;
}

export class RegisterUserUseCase {
  public constructor(
    private readonly users: UserRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const existingUser = await this.users.findByEmail(input.email);
    if (existingUser) {
      throw new AppError("Ya existe un usuario registrado con este email.", 409, "EMAIL_ALREADY_REGISTERED");
    }

    const now = new Date().toISOString();
    const workspaceId = randomUUID();
    const userId = randomUUID();

    const user: User = {
      id: userId,
      workspaceId,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await hash(input.password, 10),
      role: "OWNER",
      createdAt: now,
    };

    const workspace: Workspace = {
      id: workspaceId,
      name: input.workspaceName,
      ownerId: userId,
      plan: "starter",
      createdAt: now,
    };

    await this.users.create(user);
    await this.workspaces.create(workspace);

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId,
      userId,
      action: "AUTH_REGISTER",
      entityType: "User",
      entityId: userId,
      description: "Usuario propietario registrado y workspace creado.",
      ip: null,
      metadata: { workspaceName: input.workspaceName },
      createdAt: now,
    });

    return {
      accessToken: this.jwtService.sign({
        userId,
        workspaceId,
        role: user.role,
      }),
      user: toPublicUser(user),
      workspace,
    };
  }
}

