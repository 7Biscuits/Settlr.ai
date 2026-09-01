import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../utils/errors.js";
import { isTokenRevoked } from "../services/authService.js";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Fastify preHandler that verifies the JWT and attaches the authenticated
 * user to the request. Every protected route — including AI-initiated
 * actions — must pass through this. Auth is never bypassed for the LLM.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError("Missing or invalid authentication token");
  }

  const authHeader = request.headers.authorization;
  const rawToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader;

  if (rawToken && (await isTokenRevoked(rawToken))) {
    throw new UnauthorizedError("Authentication token has been revoked");
  }
}

