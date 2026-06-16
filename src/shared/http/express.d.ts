import type { AuthenticatedContext } from "../domain/authenticated-context";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedContext;
      requestId?: string;
    }
  }
}
