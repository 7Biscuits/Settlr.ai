/**
 * Client-side split PREVIEW only. The backend is the source of truth for the
 * actual split amounts; this exists purely to show the user a rough per-person
 * figure before submitting.
 */
export function splitEqualPreview(
  amountMinor: number,
  count: number,
): { perPersonMax: number; perPersonMin: number } {
  if (count <= 0) return { perPersonMax: 0, perPersonMin: 0 };
  const base = Math.floor(amountMinor / count);
  const remainder = amountMinor - base * count;
  return {
    perPersonMax: base + (remainder > 0 ? 1 : 0),
    perPersonMin: base,
  };
}
