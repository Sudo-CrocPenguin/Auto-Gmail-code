import type { Request, RequestHandler } from "express";

import { AppError } from "../../domain/errors/app-error";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimitMiddleware {
  private readonly entries = new Map<string, RateLimitEntry>();

  public constructor(private readonly options: RateLimitOptions) {}

  public readonly handler: RequestHandler = (request, response, next) => {
    const now = Date.now();
    this.cleanup(now);

    const key = `${this.options.keyPrefix}:${this.resolveKey(request)}`;
    const existingEntry = this.entries.get(key);
    const entry =
      existingEntry && existingEntry.resetAt > now
        ? existingEntry
        : {
            count: 0,
            resetAt: now + this.options.windowMs,
          };

    entry.count += 1;
    this.entries.set(key, entry);

    const remaining = Math.max(0, this.options.max - entry.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    response.setHeader("X-RateLimit-Limit", String(this.options.max));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());

    if (entry.count > this.options.max) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
      next(
        new AppError(
          "Demasiadas solicitudes. Intenta nuevamente mas tarde.",
          429,
          "TOO_MANY_REQUESTS",
          {
            retryAfterSeconds,
          },
        ),
      );
      return;
    }

    next();
  };

  private resolveKey(request: Request): string {
    return this.options.keyGenerator?.(request) ?? request.ip ?? "unknown";
  }

  private cleanup(now: number): void {
    for (const [key, entry] of this.entries.entries()) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}
