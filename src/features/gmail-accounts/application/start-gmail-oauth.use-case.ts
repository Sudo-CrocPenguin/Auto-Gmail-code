import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { environment } from "../../../shared/config/environment";

export interface StartGmailOAuthOutput {
  authUrl: string;
  state: string;
  provider: "GOOGLE";
  configured: boolean;
}

export class StartGmailOAuthUseCase {
  public constructor(private readonly auditLogs: AuditLogRepository) {}

  public async execute(context: AuthenticatedContext): Promise<StartGmailOAuthOutput> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden conectar Gmail.");

    const state = Buffer.from(
      JSON.stringify({
        workspaceId: context.workspaceId,
        userId: context.userId,
        nonce: randomUUID(),
      }),
    ).toString("base64url");

    const configured = Boolean(environment.google.clientId && environment.google.clientSecret);
    const authUrl = configured
      ? this.buildGoogleOAuthUrl(state)
      : `${environment.frontendUrl}/gmail-accounts?oauth=demo&state=${state}`;

    await this.auditLogs.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      action: "GMAIL_OAUTH_STARTED",
      entityType: "GmailAccount",
      entityId: null,
      description: configured
        ? "Flujo OAuth de Google iniciado."
        : "Flujo OAuth demo iniciado por falta de credenciales Google.",
      ip: null,
      metadata: { configured },
      createdAt: new Date().toISOString(),
    });

    return {
      authUrl,
      state,
      provider: "GOOGLE",
      configured,
    };
  }

  private buildGoogleOAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: environment.google.clientId,
      redirect_uri: environment.google.redirectUri,
      response_type: "code",
      scope: environment.google.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
}

