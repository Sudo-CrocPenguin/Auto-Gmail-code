import { environment } from "../../../shared/config/environment";

const defaultSessionTtlMs = 24 * 60 * 60 * 1000;

export function resolveSessionExpiresAt(from: Date = new Date()): string {
  return new Date(from.getTime() + parseDurationToMilliseconds(environment.jwtExpiresIn)).toISOString();
}

function parseDurationToMilliseconds(value: string): number {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    return defaultSessionTtlMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "ms") return amount;
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
}
