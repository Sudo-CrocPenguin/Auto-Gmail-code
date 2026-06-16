import { Router } from "express";

import { environment } from "../../config/environment";
import { prisma } from "../../infrastructure/persistence/prisma.client";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    service: "auto-gmail-code-api",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/ready", async (_request, response) => {
  const checks = {
    database: await checkDatabase(),
    gmailOAuth: checkGmailOAuthConfig(),
  };
  const failed = Object.values(checks).some((check) => check.status === "error");

  response.status(failed ? 503 : 200).json({
    status: failed ? "error" : "ok",
    service: "auto-gmail-code-api",
    timestamp: new Date().toISOString(),
    checks,
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  if (environment.persistenceDriver !== "prisma") {
    return {
      status: "skipped",
      detail: "PERSISTENCE_DRIVER no usa Prisma.",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      detail: "Prisma pudo consultar PostgreSQL.",
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Prisma no pudo consultar PostgreSQL.",
    };
  }
}

function checkGmailOAuthConfig(): HealthCheck {
  const configured = Boolean(environment.google.clientId && environment.google.clientSecret && environment.google.redirectUri);

  if (configured) {
    return {
      status: "ok",
      detail: "OAuth Gmail configurado.",
    };
  }

  return {
    status: environment.nodeEnv === "production" ? "error" : "warning",
    detail: "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET.",
  };
}

interface HealthCheck {
  status: "ok" | "warning" | "error" | "skipped";
  detail: string;
}
