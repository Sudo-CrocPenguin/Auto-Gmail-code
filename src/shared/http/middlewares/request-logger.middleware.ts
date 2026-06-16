import type { RequestHandler } from "express";

import { logger } from "../../infrastructure/observability/logger";

export const requestLoggerMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const metadata = {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
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
