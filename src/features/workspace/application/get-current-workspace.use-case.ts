import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { NotFoundError } from "../../../shared/domain/errors/not-found-error";
import type { Workspace } from "../domain/workspace.entity";
import type { WorkspaceRepository } from "../domain/workspace.repository";

export class GetCurrentWorkspaceUseCase {
  public constructor(private readonly workspaces: WorkspaceRepository) {}

  public async execute(context: AuthenticatedContext): Promise<Workspace> {
    const workspace = await this.workspaces.findById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("El workspace no existe.", "WORKSPACE_NOT_FOUND");
    }

    return workspace;
  }
}

