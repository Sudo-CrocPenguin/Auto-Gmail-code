import type { Workspace } from "./workspace.entity";

export interface WorkspaceRepository {
  create(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  findByOwnerId(ownerId: string): Promise<Workspace | null>;
  update(id: string, data: Partial<Pick<Workspace, "name" | "plan">>): Promise<Workspace | null>;
}

