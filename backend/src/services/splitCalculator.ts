/**
 * Splits an amount (in integer minor units) equally across `count`
 * participants. Any remainder from integer division is distributed one unit
 * at a time to the first participants so the shares always sum to `amount`.
 */
export function splitEqual(amount: number, count: number): number[] {
  if (count <= 0) {
    throw new Error("Participant count must be positive");
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative integer (minor units)");
  }
  const base = Math.floor(amount / count);
  let remainder = amount - base * count;
  const shares: number[] = [];
  for (let i = 0; i < count; i++) {
    shares.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return shares;
}

/**
 * Validates that a set of custom split amounts sums exactly to the total.
 * Returns the amounts unchanged when valid; throws otherwise.
 */
export function validateCustomSplit(
  amount: number,
  shares: number[],
): number[] {
  if (shares.length === 0) {
    throw new Error("At least one split is required");
  }
  for (const s of shares) {
    if (!Number.isInteger(s) || s < 0) {
      throw new Error("Each split must be a non-negative integer (minor units)");
    }
  }
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum !== amount) {
    throw new Error(
      `Custom splits (${sum}) must sum to the expense amount (${amount})`,
    );
  }
  return shares;
}
