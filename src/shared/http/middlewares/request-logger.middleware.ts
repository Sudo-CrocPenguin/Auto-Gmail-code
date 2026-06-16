import type { RequestHandler } from "express";

import { logger } from "../../infrastructure/observability/logger";

export const requestLoggerMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const metadata = {
      requestId: request.requestId,
      method: request.method,
      path: sanitizeRequestPath(request.originalUrl),
      statusCode: response.statusCode,
      durationMs,
      ip: request.ip,
      userAgent: request.get("user-agent"),
      userId: request.auth?.userId,
      workspaceId: request.auth?.workspaceId,
    };

    if (response.statusCode >= 500) {
      logger.error("request_completed", metadata);
      return;
    }

    if (response.statusCode >= 400) {
      logger.warn("request_completed", metadata);
      return;
    }

    logger.info("request_completed", metadata);
  });

  next();
};

const sensitiveQueryParams = new Set([
  "access_token",
  "code",
  "id_token",
  "refresh_token",
  "state",
  "token",
]);

function sanitizeRequestPath(originalUrl: string): string {
  const [path, query] = originalUrl.split("?", 2);
  if (!query) {
    return originalUrl;
  }

  const params = new URLSearchParams(query);
  for (const key of params.keys()) {
    if (sensitiveQueryParams.has(key.toLowerCase())) {
      params.set(key, "[REDACTED]");
    }
  }

  return `${path}?${params.toString()}`;
}
