import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  public constructor(message: string, code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

