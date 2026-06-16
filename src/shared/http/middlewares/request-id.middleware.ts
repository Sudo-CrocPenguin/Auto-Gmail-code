import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const requestId = extractRequestId(request.header("x-request-id")) ?? randomUUID();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  next();
};

function extractRequestId(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 128) {
    return undefined;
  }

  return trimmed;
}
