import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  public constructor(message = "No tienes permisos para realizar esta accion.") {
    super(message, 403, "FORBIDDEN");
  }
}

