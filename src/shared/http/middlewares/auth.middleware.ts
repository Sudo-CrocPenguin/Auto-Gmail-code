import type { RequestHandler } from "express";

import { JwtService } from "../../infrastructure/security/jwt.service";
import { AppError } from "../../domain/errors/app-error";

export class AuthMiddleware {
  public constructor(private readonly jwtService: JwtService) {}

  public readonly handler: RequestHandler = (request, _response, next) => {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      next(new AppError("Debes iniciar sesion para acceder a este recurso.", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const token = authorization.slice("Bearer ".length);
      request.auth = this.jwtService.verify(token);
      next();
    } catch {
      next(new AppError("La sesion no es valida o expiro.", 401, "UNAUTHORIZED"));
    }
  };
}

