import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../../domain/errors/app-error";
import { logger } from "../../infrastructure/observability/logger";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Los datos enviados no son validos.",
        details: error.flatten(),
        requestId: request.requestId,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error("operational_error", {
        requestId: request.requestId,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.requestId,
      },
    });
    return;
  }

  logger.error("unexpected_error", {
    requestId: request.requestId,
    error: serializeError(error),
  });

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocurrio un error inesperado.",
      requestId: request.requestId,
    },
  });
};

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: String(error) };
}
