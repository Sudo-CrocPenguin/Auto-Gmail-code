import type { RequestHandler } from "express";

import type { AppSessionRepository } from "../../../features/auth/domain/app-session.repository";
import { JwtService } from "../../infrastructure/security/jwt.service";
import { AppError } from "../../domain/errors/app-error";

export class AuthMiddleware {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly appSessions: AppSessionRepository,
  ) {}

  public readonly handler: RequestHandler = async (request, _response, next) => {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      next(new AppError("Debes iniciar sesion para acceder a este recurso.", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const token = authorization.slice("Bearer ".length);
      const context = this.jwtService.verify(token);
      const session = await this.appSessions.findById(context.sessionId);

      if (
        !session ||
        session.revokedAt ||
        session.userId !== context.userId ||
        session.workspaceId !== context.workspaceId ||
        new Date(session.expiresAt).getTime() <= Date.now()
      ) {
        next(new AppError("La sesion no es valida o expiro.", 401, "UNAUTHORIZED"));
        return;
      }

      request.auth = context;
      await this.appSessions.touch(session.id, new Date().toISOString());
      next();
    } catch {
      next(new AppError("La sesion no es valida o expiro.", 401, "UNAUTHORIZED"));
    }
  };
}
