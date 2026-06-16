import "dotenv/config";

import { z } from "zod";

const defaultJwtSecret = "change-me-in-local-env";
const defaultTokenEncryptionKey = "change-me-token-encryption-key";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().startsWith("/").default("/api"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PERSISTENCE_DRIVER: z.enum(["memory", "prisma"]).default("memory"),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default(defaultJwtSecret),
  JWT_EXPIRES_IN: z.string().default("1d"),
  TOKEN_ENCRYPTION_KEY: z.string().min(16).default(defaultTokenEncryptionKey),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_GMAIL_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000),
  RATE_LIMIT_GMAIL_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_SYNC_WINDOW_MS: z.coerce.number().int().positive().default(5 * 60 * 1000),
  RATE_LIMIT_SYNC_MAX: z.coerce.number().int().positive().default(5),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_OAUTH_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/gmail/oauth/callback"),
  GOOGLE_OAUTH_SCOPES: z
    .string()
    .default(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
    ),
  GMAIL_SYNC_MAX_MESSAGES: z.coerce.number().int().positive().max(100).default(25),
  GMAIL_ATTACHMENT_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
});

const parsedEnvironment = environmentSchema.parse(process.env);

if (parsedEnvironment.NODE_ENV === "production") {
  const productionErrors: string[] = [];

  if (isUnsafeProductionSecret(parsedEnvironment.JWT_SECRET, defaultJwtSecret)) {
    productionErrors.push("JWT_SECRET debe ser un secreto real de al menos 32 caracteres en production.");
  }

  if (isUnsafeProductionSecret(parsedEnvironment.TOKEN_ENCRYPTION_KEY, defaultTokenEncryptionKey)) {
    productionErrors.push("TOKEN_ENCRYPTION_KEY debe ser un secreto real de al menos 32 caracteres en production.");
  }

  if (parsedEnvironment.PERSISTENCE_DRIVER !== "prisma") {
    productionErrors.push("PERSISTENCE_DRIVER debe ser prisma en production.");
  }

  if (!parsedEnvironment.DATABASE_URL) {
    productionErrors.push("DATABASE_URL es obligatorio en production.");
  }

  if (!parsedEnvironment.GOOGLE_CLIENT_ID || isPlaceholderValue(parsedEnvironment.GOOGLE_CLIENT_ID)) {
    productionErrors.push("GOOGLE_CLIENT_ID es obligatorio en production.");
  }

  if (!parsedEnvironment.GOOGLE_CLIENT_SECRET || isPlaceholderValue(parsedEnvironment.GOOGLE_CLIENT_SECRET)) {
    productionErrors.push("GOOGLE_CLIENT_SECRET es obligatorio en production.");
  }

  if (productionErrors.length > 0) {
    throw new Error(`Configuracion production invalida: ${productionErrors.join(" ")}`);
  }
}

export const environment = {
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  apiPrefix: parsedEnvironment.API_PREFIX,
  frontendUrl: parsedEnvironment.FRONTEND_URL,
  persistenceDriver: parsedEnvironment.PERSISTENCE_DRIVER,
  databaseUrl: parsedEnvironment.DATABASE_URL,
  jwtSecret: parsedEnvironment.JWT_SECRET,
  jwtExpiresIn: parsedEnvironment.JWT_EXPIRES_IN,
  tokenEncryptionKey: parsedEnvironment.TOKEN_ENCRYPTION_KEY,
  rateLimit: {
    auth: {
      windowMs: parsedEnvironment.RATE_LIMIT_AUTH_WINDOW_MS,
      max: parsedEnvironment.NODE_ENV === "test" ? 1000 : parsedEnvironment.RATE_LIMIT_AUTH_MAX,
    },
    gmail: {
      windowMs: parsedEnvironment.RATE_LIMIT_GMAIL_WINDOW_MS,
      max: parsedEnvironment.RATE_LIMIT_GMAIL_MAX,
    },
    sync: {
      windowMs: parsedEnvironment.RATE_LIMIT_SYNC_WINDOW_MS,
      max: parsedEnvironment.RATE_LIMIT_SYNC_MAX,
    },
  },
  google: {
    clientId: parsedEnvironment.GOOGLE_CLIENT_ID,
    clientSecret: parsedEnvironment.GOOGLE_CLIENT_SECRET,
    redirectUri: parsedEnvironment.GOOGLE_OAUTH_REDIRECT_URI,
    scopes: parsedEnvironment.GOOGLE_OAUTH_SCOPES.split(" ").filter(Boolean),
    syncMaxMessages: parsedEnvironment.GMAIL_SYNC_MAX_MESSAGES,
    attachmentMaxBytes: parsedEnvironment.GMAIL_ATTACHMENT_MAX_BYTES,
  },
} as const;

function isUnsafeProductionSecret(value: string, defaultValue: string): boolean {
  return value === defaultValue || value.length < 32 || isPlaceholderValue(value);
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("change-me") ||
    normalized.includes("replace-with") ||
    normalized.includes("example")
  );
}
