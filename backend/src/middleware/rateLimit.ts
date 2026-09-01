import type { FastifyRequest } from "fastify";
import { AppError } from "../utils/errors.js";

type RateLimitOptions = {
  /** Maximum requests from one IP during the window. */
  max: number;
  windowMs: number;
};

type Entry = { count: number; resetAt: number };

/**
 * A deliberately small, dependency-free limiter for a single hackathon API
 * process. Replace it with Redis-backed limiting before horizontally scaling.
 */
export function createRateLimiter({ max, windowMs }: RateLimitOptions) {
  const entries = new Map<string, Entry>();

  return async function rateLimit(request: FastifyRequest): Promise<void> {
    const now = Date.now();
    const key = `${request.ip}:${request.routeOptions.url}`;
    const entry = entries.get(key);
    if (!entry || entry.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      throw new AppError(429, "Too many requests. Please try again shortly.");
    }
  };
}
