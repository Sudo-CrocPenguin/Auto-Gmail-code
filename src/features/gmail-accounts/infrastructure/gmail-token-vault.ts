import type { Credentials } from "google-auth-library";

import type { GmailOAuthTokenRepository } from "../domain/gmail-oauth-token.repository";
import { TokenEncryptionService } from "../../../shared/infrastructure/security/token-encryption.service";

export class GmailTokenVault {
  public constructor(
    private readonly tokens: GmailOAuthTokenRepository,
    private readonly encryption: TokenEncryptionService,
  ) {}

  public async saveCredentials(input: {
    workspaceId: string;
    gmailAccountId: string;
    credentials: Credentials;
  }): Promise<void> {
    const existing = await this.tokens.findByAccountId(input.gmailAccountId);
    const now = new Date().toISOString();
    const refreshToken =
      input.credentials.refresh_token ??
      this.encryption.decrypt(existing?.encryptedRefreshToken ?? null);

    await this.tokens.upsert({
      gmailAccountId: input.gmailAccountId,
      workspaceId: input.workspaceId,
      encryptedAccessToken: this.encryption.encrypt(input.credentials.access_token),
      encryptedRefreshToken: this.encryption.encrypt(refreshToken),
      encryptedIdToken: this.encryption.encrypt(input.credentials.id_token),
      scope: input.credentials.scope ?? existing?.scope ?? null,
      tokenType: input.credentials.token_type ?? existing?.tokenType ?? null,
      expiryDate: input.credentials.expiry_date ?? existing?.expiryDate ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  public async getCredentials(gmailAccountId: string): Promise<Credentials | null> {
    const token = await this.tokens.findByAccountId(gmailAccountId);
    if (!token) {
      return null;
    }

    const credentials: Credentials = {};
    const accessToken = this.encryption.decrypt(token.encryptedAccessToken);
    const refreshToken = this.encryption.decrypt(token.encryptedRefreshToken);
    const idToken = this.encryption.decrypt(token.encryptedIdToken);

    if (accessToken) credentials.access_token = accessToken;
    if (refreshToken) credentials.refresh_token = refreshToken;
    if (idToken) credentials.id_token = idToken;
    if (token.scope) credentials.scope = token.scope;
    if (token.tokenType) credentials.token_type = token.tokenType;
    if (token.expiryDate !== null) credentials.expiry_date = token.expiryDate;

    return credentials;
  }

  public async deleteCredentials(gmailAccountId: string): Promise<void> {
    await this.tokens.deleteByAccountId(gmailAccountId);
  }
}
