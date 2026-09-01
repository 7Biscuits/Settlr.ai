import { apiFetch } from "./client";
import type { HealthStatus } from "./types";

export function getHealthStatus(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}
