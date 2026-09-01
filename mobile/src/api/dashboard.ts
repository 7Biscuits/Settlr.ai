import { apiFetch } from "./client";
import type { DashboardSummary } from "./types";

/** Financial totals are calculated and returned by the backend. */
export function getDashboard(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard");
}
