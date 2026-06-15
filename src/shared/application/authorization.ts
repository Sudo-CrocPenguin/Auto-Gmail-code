import type { AuthenticatedContext } from "../domain/authenticated-context";
import { ForbiddenError } from "../domain/errors/forbidden-error";

export function assertOwnerOrAdmin(context: AuthenticatedContext, message?: string): void {
  if (context.role !== "OWNER" && context.role !== "ADMIN") {
    throw new ForbiddenError(message);
  }
}

