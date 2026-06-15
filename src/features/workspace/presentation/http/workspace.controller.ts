import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { GetCurrentWorkspaceUseCase } from "../../application/get-current-workspace.use-case";
import type { UpdateCurrentWorkspaceUseCase } from "../../application/update-current-workspace.use-case";
import { updateWorkspaceDto } from "./workspace.dtos";

export class WorkspaceController {
  public constructor(
    private readonly getCurrentWorkspace: GetCurrentWorkspaceUseCase,
    private readonly updateCurrentWorkspace: UpdateCurrentWorkspaceUseCase,
  ) {}

  public readonly getCurrent: RequestHandler = asyncHandler(async (request, response) => {
    const workspace = await this.getCurrentWorkspace.execute(getAuthContext(request));
    response.json({ data: workspace });
  });

  public readonly updateCurrent: RequestHandler = asyncHandler(async (request, response) => {
    const input = updateWorkspaceDto.parse(request.body);
    const workspace = await this.updateCurrentWorkspace.execute(getAuthContext(request), input);
    response.json({ data: workspace });
  });
}

