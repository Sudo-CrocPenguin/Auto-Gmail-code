import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";

export interface GetGmailOAuthStatusInput {
  status?: string | undefined;
  error?: string | undefined;
}

export class GetGmailOAuthStatusUseCase {
  public async execute(_context: AuthenticatedContext, input: GetGmailOAuthStatusInput) {
    if (input.error) {
      return {
        status: "ERROR" as const,
        message: "Google no completo la autorizacion OAuth.",
        error: input.error,
      };
    }

    if (input.status === "success" || input.status === "connected") {
      return {
        status: "CONNECTED" as const,
        message: "Cuenta Gmail conectada correctamente.",
      };
    }

    return {
      status: "PENDING" as const,
      message: "No hay resultado OAuth final disponible para esta sesion.",
    };
  }
}
