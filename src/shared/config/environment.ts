import "dotenv/config";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().startsWith("/").default("/api"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16).default("change-me-in-local-env"),
  JWT_EXPIRES_IN: z.string().default("1d"),
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
});

const parsedEnvironment = environmentSchema.parse(process.env);

export const environment = {
  nodeEnv: parsedEnvironment.NODE_ENV,
  port: parsedEnvironment.PORT,
  apiPrefix: parsedEnvironment.API_PREFIX,
  frontendUrl: parsedEnvironment.FRONTEND_URL,
  jwtSecret: parsedEnvironment.JWT_SECRET,
  jwtExpiresIn: parsedEnvironment.JWT_EXPIRES_IN,
  google: {
    clientId: parsedEnvironment.GOOGLE_CLIENT_ID,
    clientSecret: parsedEnvironment.GOOGLE_CLIENT_SECRET,
    redirectUri: parsedEnvironment.GOOGLE_OAUTH_REDIRECT_URI,
    scopes: parsedEnvironment.GOOGLE_OAUTH_SCOPES.split(" ").filter(Boolean),
  },
} as const;

