import { createHash } from "node:crypto";

import jwt from "jsonwebtoken";
import { z } from "zod";

import { environment } from "../../../shared/config/environment";
import { AppError } from "../../../shared/domain/errors/app-error";

const oauthStatePayloadSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  accountId: z.string().min(1).optional(),
  nonce: z.string().min(1),
});

export type GmailOAuthState = z.infer<typeof oauthStatePayloadSchema>;

export class OAuthStateService {
  private readonly ttlMs = 10 * 60 * 1000;

  public sign(payload: GmailOAuthState): string {
    return jwt.sign(payload, environment.jwtSecret, {
      expiresIn: "10m",
      audience: "gmail-oauth",
      issuer: "auto-gmail-code",
    });
  }

  public verify(state: string | undefined): GmailOAuthState {
    if (!state) {
      throw new AppError("El state OAuth no fue enviado.", 400, "OAUTH_STATE_REQUIRED");
    }

    try {
      const decoded = jwt.verify(state, environment.jwtSecret, {
        audience: "gmail-oauth",
        issuer: "auto-gmail-code",
      });
      return oauthStatePayloadSchema.parse(decoded);
    } catch {
      throw new AppError("El state OAuth no es valido o expiro.", 400, "OAUTH_STATE_INVALID");
    }
  }

  public hash(state: string): string {
    return createHash("sha256").update(state).digest("hex");
  }

  public expiresAt(from: Date = new Date()): string {
    return new Date(from.getTime() + this.ttlMs).toISOString();
  }
}
