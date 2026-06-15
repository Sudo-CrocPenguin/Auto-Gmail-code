import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { GetWorkspaceSettingsUseCase } from "../../application/get-workspace-settings.use-case";
import type { UpdateWorkspaceSettingsUseCase } from "../../application/update-workspace-settings.use-case";
import { workspaceSettingsDto } from "./settings.dtos";

export class SettingsController {
  public constructor(
    private readonly getWorkspaceSettings: GetWorkspaceSettingsUseCase,
    private readonly updateWorkspaceSettings: UpdateWorkspaceSettingsUseCase,
  ) {}

  public readonly get: RequestHandler = asyncHandler(async (request, response) => {
    const data = await this.getWorkspaceSettings.execute(getAuthContext(request));
    response.json({ data });
  });

  public readonly update: RequestHandler = asyncHandler(async (request, response) => {
    const input = workspaceSettingsDto.parse(request.body);
    const data = await this.updateWorkspaceSettings.execute(getAuthContext(request), input);
    response.json({ data });
  });
}

