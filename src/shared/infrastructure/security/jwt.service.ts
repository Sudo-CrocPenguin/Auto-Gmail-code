import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";

import { environment } from "../../config/environment";
import type { AuthenticatedContext } from "../../domain/authenticated-context";

const jwtPayloadSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export class JwtService {
  public sign(payload: AuthenticatedContext): string {
    const options: SignOptions = {
      expiresIn: environment.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
    };

    return jwt.sign(payload, environment.jwtSecret, options);
  }

  public verify(token: string): AuthenticatedContext {
    const decoded = jwt.verify(token, environment.jwtSecret);
    return jwtPayloadSchema.parse(decoded);
  }
}
