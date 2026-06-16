import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const oldKey = process.env.OLD_TOKEN_ENCRYPTION_KEY;
const newKey = process.env.TOKEN_ENCRYPTION_KEY;

if (!oldKey || oldKey.length < 16) {
  throw new Error("OLD_TOKEN_ENCRYPTION_KEY es obligatorio y debe tener al menos 16 caracteres.");
}

if (!newKey || newKey.length < 16) {
  throw new Error("TOKEN_ENCRYPTION_KEY es obligatorio y debe tener al menos 16 caracteres.");
}

if (oldKey === newKey) {
  throw new Error("OLD_TOKEN_ENCRYPTION_KEY y TOKEN_ENCRYPTION_KEY deben ser diferentes.");
}

const prisma = new PrismaClient();
const oldCipher = new TokenCipher(oldKey);
const newCipher = new TokenCipher(newKey);

async function main() {
  const tokens = await prisma.gmailOAuthToken.findMany();

  for (const token of tokens) {
    await prisma.gmailOAuthToken.update({
      where: { gmailAccountId: token.gmailAccountId },
      data: {
        encryptedAccessToken: reencrypt(token.encryptedAccessToken),
        encryptedRefreshToken: reencrypt(token.encryptedRefreshToken),
        encryptedIdToken: reencrypt(token.encryptedIdToken),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Re-cifrados ${tokens.length} registros de gmail_oauth_tokens.`);
}

function reencrypt(value: string | null): string | null {
  const decrypted = oldCipher.decrypt(value);
  return newCipher.encrypt(decrypted);
}

class TokenCipher {
  private readonly key: Buffer;

  public constructor(secret: string) {
    this.key = createHash("sha256").update(secret).digest();
  }

  public encrypt(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, encrypted].map((part) => part.toString("base64url")).join(".");
  }

  public decrypt(value: string | null): string | null {
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
