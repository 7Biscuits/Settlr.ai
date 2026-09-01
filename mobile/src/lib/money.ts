/**
 * Formatting helpers for the demo currency. The backend stores and computes all
 * amounts in integer minor units (1 unit = 1/100). These helpers only format
 * for display and parse user input — no financial logic lives here.
 */

const CURRENCY_SYMBOL = "₹"; // demo currency symbol

/** Formats integer minor units as a signed major-unit string with symbol. */
export function formatAmount(minor: number): string {
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const major = (abs / 100).toFixed(2);
  return `${negative ? "-" : ""}${CURRENCY_SYMBOL}${major}`;
}

/** Formats without a sign (for magnitudes like "you owe X"). */
export function formatAbsAmount(minor: number): string {
  return `${CURRENCY_SYMBOL}${(Math.abs(minor) / 100).toFixed(2)}`;
}

/**
 * Parses a user-entered major-unit string (e.g. "12.50") into integer minor
 * units. Returns null when the input is not a valid positive amount.
 */
export function parseAmountToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Math.round(Number(trimmed) * 100);
  return Number.isFinite(value) && value > 0 ? value : null;
}
