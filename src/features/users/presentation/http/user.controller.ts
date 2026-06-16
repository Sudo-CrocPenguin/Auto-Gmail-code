import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { UpdateCurrentUserProfileUseCase } from "../../application/update-current-user-profile.use-case";
import { updateCurrentUserProfileDto } from "./user.dtos";

export class UserController {
  public constructor(private readonly updateCurrentUserProfile: UpdateCurrentUserProfileUseCase) {}

  public readonly updateMe: RequestHandler = asyncHandler(async (request, response) => {
    const input = updateCurrentUserProfileDto.parse(request.body);
    const user = await this.updateCurrentUserProfile.execute(getAuthContext(request), {
      ...input,
      ip: request.ip ?? null,
    });

    response.json({ data: user });
  });
}
