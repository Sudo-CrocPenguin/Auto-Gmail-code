import type { RequestHandler } from "express";

import { asyncHandler } from "../../../../shared/http/async-handler";
import { getAuthContext } from "../../../../shared/http/request-context";
import type { ChangePasswordUseCase } from "../../application/change-password.use-case";
import type { GetAuthenticatedUserUseCase } from "../../application/get-authenticated-user.use-case";
import type { LoginUserUseCase } from "../../application/login-user.use-case";
import type { LogoutUserUseCase } from "../../application/logout-user.use-case";
import type { RegisterUserUseCase } from "../../application/register-user.use-case";
import { changePasswordDto, loginUserDto, registerUserDto } from "./auth.dtos";

export class AuthController {
  public constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly getAuthenticatedUser: GetAuthenticatedUserUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly changePassword: ChangePasswordUseCase,
  ) {}

  public readonly register: RequestHandler = asyncHandler(async (request, response) => {
    const input = registerUserDto.parse(request.body);
    const result = await this.registerUser.execute({
      ...input,
      ip: request.ip ?? null,
      userAgent: request.headers["user-agent"] ?? null,
    });
    response.status(201).json(result);
  });

  public readonly login: RequestHandler = asyncHandler(async (request, response) => {
    const input = loginUserDto.parse(request.body);
    const result = await this.loginUser.execute({
      ...input,
      ip: request.ip ?? null,
      userAgent: request.headers["user-agent"] ?? null,
    });
    response.json(result);
  });

  public readonly me: RequestHandler = asyncHandler(async (request, response) => {
    const result = await this.getAuthenticatedUser.execute(getAuthContext(request));
    response.json(result);
  });

  public readonly logout: RequestHandler = asyncHandler(async (request, response) => {
    await this.logoutUser.execute(getAuthContext(request), request.ip ?? null);
    response.json({ success: true });
  });

  public readonly password: RequestHandler = asyncHandler(async (request, response) => {
    const input = changePasswordDto.parse(request.body);
    await this.changePassword.execute(getAuthContext(request), {
      ...input,
      ip: request.ip ?? null,
    });
    response.json({ success: true });
  });
}
