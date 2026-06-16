import { randomUUID } from "node:crypto";

import type { AuditLogRepository } from "../../audit/domain/audit-log.repository";
import { assertOwnerOrAdmin } from "../../../shared/application/authorization";
import type { AuthenticatedContext } from "../../../shared/domain/authenticated-context";
import { environment } from "../../../shared/config/environment";
import type { GmailOAuthStateRepository } from "../domain/gmail-oauth-state.repository";
import { GoogleGmailClient } from "../infrastructure/google-gmail.client";
import { OAuthStateService } from "./oauth-state.service";

export interface StartGmailOAuthOutput {
  authUrl: string;
  state: string;
  provider: "GOOGLE";
  configured: boolean;
}

export class StartGmailOAuthUseCase {
  public constructor(
    private readonly auditLogs: AuditLogRepository,
    private readonly oauthStates: GmailOAuthStateRepository,
    private readonly gmailClient: GoogleGmailClient,
    private readonly oauthStateService: OAuthStateService,
  ) {}

  public async execute(context: AuthenticatedContext): Promise<StartGmailOAuthOutput> {
    assertOwnerOrAdmin(context, "Solo propietarios o administradores pueden conectar Gmail.");

    const nonce = randomUUID();
    const now = new Date();
    const state = this.oauthStateService.sign({
      workspaceId: context.workspaceId,
      userId: context.userId,
      nonce,
    });
    await this.oauthStates.deleteExpired(now.toISOString());
    await this.oauthStates.create({
      id: randomUUID(),
      workspaceId: context.workspaceId,
      userId: context.userId,
      accountId: null,
      nonce,
      stateHash: this.oauthStateService.hash(state),
      createdAt: now.toISOString(),
      expiresAt: this.oauthStateService.expiresAt(now),
      consumedAt: null,
    });

    const configured = Boolean(environment.google.clientId && environment.google.clientSecret);
    const authUrl = configured
      ? this.gmailClient.buildAuthUrl(state)
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

}
