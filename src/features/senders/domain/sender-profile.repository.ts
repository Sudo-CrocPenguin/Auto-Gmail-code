import type { PaginatedResult, PaginationParams } from "../../../shared/application/pagination";
import type { SenderProfile } from "./sender-profile.entity";

export interface SenderQueryParams extends PaginationParams {
  workspaceId: string;
  search?: string | undefined;
  status?: SenderProfile["status"] | undefined;
}

export interface SenderProfileRepository {
  create(sender: SenderProfile): Promise<SenderProfile>;
  findById(id: string): Promise<SenderProfile | null>;
  findByEmail(workspaceId: string, email: string): Promise<SenderProfile | null>;
  findByWorkspace(params: SenderQueryParams): Promise<PaginatedResult<SenderProfile>>;
  update(id: string, data: Partial<SenderProfile>): Promise<SenderProfile | null>;
}
