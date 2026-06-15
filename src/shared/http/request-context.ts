import type { Request } from "express";

import type { AuthenticatedContext } from "../domain/authenticated-context";
import { AppError } from "../domain/errors/app-error";

export function getAuthContext(request: Request): AuthenticatedContext {
  if (!request.auth) {
    throw new AppError("La sesion no es valida o expiro.", 401, "UNAUTHORIZED");
  }

  return request.auth;
}

