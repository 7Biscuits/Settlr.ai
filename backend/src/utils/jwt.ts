import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

/**
 * Signs a JWT for the given user payload using the Fastify JWT plugin.
 * Kept as a thin helper so token creation is consistent across the app.
 */
export function signAccessToken(
  app: FastifyInstance,
  payload: { id: string; email: string },
): string {
  return app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN });
}
