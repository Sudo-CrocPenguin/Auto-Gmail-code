import type { Workspace } from "../../workspace/domain/workspace.entity";
import type { WorkspaceRepository } from "../../workspace/domain/workspace.repository";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import type { PublicUser } from "../domain/user.entity";
import { toPublicUser } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

export interface GetAuthenticatedUserOutput {
  user: PublicUser;
  workspace: Workspace;
}

export class GetAuthenticatedUserUseCase {
  public constructor(
    private readonly users: UserRepository,
    private readonly workspaces: WorkspaceRepository,
  ) {}

  public async execute(context: AuthenticatedContext): Promise<GetAuthenticatedUserOutput> {
    const user = await this.users.findById(context.userId);
    if (!user) {
      throw new NotFoundError("El usuario autenticado no existe.", "USER_NOT_FOUND");
    }

    const workspace = await this.workspaces.findById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("El workspace autenticado no existe.", "WORKSPACE_NOT_FOUND");
    }

    return {
      user: toPublicUser(user),
      workspace,
    };
  }
}

