import { apiFetch } from "./client";
import type { AuthResponse, User } from "./types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  name: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name, password }),
  });
}

export function logout(): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/auth/logout", {
    method: "POST",
  });
}

export function getMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/auth/me");
}
