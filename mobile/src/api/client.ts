import { API_BASE_URL } from "./config";
import { getToken, clearToken } from "./session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Lets the auth layer react to 401s (e.g. sign the user out). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

/**
 * Typed fetch wrapper. Attaches the JWT from secure storage, sets JSON headers,
 * and normalizes backend error shapes into ApiError. On 401 it clears the token
 * and notifies the auth layer. The backend remains the source of truth; this
 * layer performs no business logic.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(
      0,
      err instanceof Error ? err.message : "Network request failed",
    );
  }

  if (res.status === 401) {
    await clearToken();
    onUnauthorized?.();
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message ?? body.error ?? message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
