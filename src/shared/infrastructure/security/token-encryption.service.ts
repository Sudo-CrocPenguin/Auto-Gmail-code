import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { environment } from "../../config/environment";

export class TokenEncryptionService {
  private readonly key = createHash("sha256").update(environment.tokenEncryptionKey).digest();

  public encrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
  }

  public decrypt(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const [iv, authTag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));

    if (!iv || !authTag || !encrypted) {
      throw new Error("Encrypted token payload is invalid.");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}

