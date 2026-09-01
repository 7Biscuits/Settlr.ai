import { ValidationError } from "../utils/errors.js";

/**
 * Splits an amount (in integer minor units) equally across `count`
 * participants. Any remainder from integer division is distributed one unit
 * at a time to the first participants so the shares always sum to `amount`.
 */
export function splitEqual(amount: number, count: number): number[] {
  if (count <= 0) {
    throw new ValidationError("Participant count must be positive");
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError("Amount must be a non-negative integer (minor units)");
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
    throw new ValidationError("At least one split is required");
  }
  for (const s of shares) {
    if (!Number.isInteger(s) || s < 0) {
      throw new ValidationError("Each split must be a non-negative integer (minor units)");
    }
  }
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum !== amount) {
    throw new ValidationError(
      `Custom splits (${sum}) must sum to the expense amount (${amount})`,
    );
  }
  return shares;
}

/**
 * Splits an amount (in integer minor units) based on percentages for each participant.
 * The sum of percentages must equal 100.
 * Any remainder pennies from rounding are distributed one unit at a time to the
 * participants with the largest rounding fractions so shares sum exactly to `amount`.
 */
export function splitPercentage(
  amount: number,
  percentages: number[],
): number[] {
  if (percentages.length === 0) {
    throw new ValidationError("At least one percentage share is required");
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError("Amount must be a non-negative integer (minor units)");
  }
  const totalPercentage = percentages.reduce((a, b) => a + b, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new ValidationError(`Percentages (${totalPercentage}%) must sum to 100%`);
  }
  for (const p of percentages) {
    if (p < 0) {
      throw new ValidationError("Percentage must be non-negative");
    }
  }

  const exactShares = percentages.map((p) => (amount * p) / 100);
  const baseShares = exactShares.map((s) => Math.floor(s));
  let remainder = amount - baseShares.reduce((a, b) => a + b, 0);

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

/**
 * Splits an amount (in integer minor units) based on integer share weights for each participant.
 * For example, weights [2, 1, 1] splits 50% to the first, 25% to second, 25% to third.
 * Remainder pennies from integer division are distributed to participants with largest fractional parts.
 */
export function splitShares(amount: number, weights: number[]): number[] {
  if (weights.length === 0) {
    throw new ValidationError("At least one share weight is required");
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError("Amount must be a non-negative integer (minor units)");
  }
  for (const w of weights) {
    if (!Number.isInteger(w) || w <= 0) {
      throw new ValidationError("Share weights must be positive integers (>= 1)");
    }
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    throw new ValidationError("Total share weights must be greater than zero");
  }

  const exactShares = weights.map((w) => (amount * w) / totalWeight);
  const baseShares = exactShares.map((s) => Math.floor(s));
  let remainder = amount - baseShares.reduce((a, b) => a + b, 0);

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


