/**
 * Client-side split PREVIEW helpers. The backend is the source of truth for the
 * actual split amounts; these exist purely to show the user a preview before submitting.
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

export function splitPercentagePreview(
  amountMinor: number,
  percentages: number[],
): number[] {
  if (percentages.length === 0 || amountMinor <= 0) return [];
  const exactShares = percentages.map((p) => (amountMinor * p) / 100);
  const baseShares = exactShares.map((s) => Math.floor(s));
  let remainder = amountMinor - baseShares.reduce((a, b) => a + b, 0);

  const indexed = exactShares.map((exact, index) => ({
    index,
    fraction: exact - baseShares[index]!,
  }));
  indexed.sort((a, b) => b.fraction - a.fraction);

  const result = [...baseShares];
  for (const item of indexed) {
    if (remainder <= 0) break;
    result[item.index]! += 1;
    remainder--;
  }

  return result;
}

export function splitSharesPreview(
  amountMinor: number,
  weights: number[],
): number[] {
  if (weights.length === 0 || amountMinor <= 0) return [];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return weights.map(() => 0);

  const exactShares = weights.map((w) => (amountMinor * w) / totalWeight);
  const baseShares = exactShares.map((s) => Math.floor(s));
  let remainder = amountMinor - baseShares.reduce((a, b) => a + b, 0);

  const indexed = exactShares.map((exact, index) => ({
    index,
    fraction: exact - baseShares[index]!,
  }));
  indexed.sort((a, b) => b.fraction - a.fraction);

  const result = [...baseShares];
  for (const item of indexed) {
    if (remainder <= 0) break;
    result[item.index]! += 1;
    remainder--;
  }

  return result;
}
