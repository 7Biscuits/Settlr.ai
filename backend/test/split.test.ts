import { describe, it, expect } from "vitest";
import {
  splitEqual,
  validateCustomSplit,
  splitPercentage,
  splitShares,
} from "../src/services/splitCalculator.js";

describe("splitEqual", () => {
  it("splits evenly when divisible", () => {
    expect(splitEqual(1000, 4)).toEqual([250, 250, 250, 250]);
  });

  it("distributes the remainder to the first participants", () => {
    const shares = splitEqual(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it("always sums to the total for awkward amounts", () => {
    for (const [amount, count] of [
      [101, 3],
      [7, 2],
      [999, 7],
      [1, 4],
    ] as const) {
      const shares = splitEqual(amount, count);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(amount);
      expect(shares).toHaveLength(count);
    }
  });

  it("throws on non-positive count", () => {
    expect(() => splitEqual(100, 0)).toThrow();
  });
});

describe("validateCustomSplit", () => {
  it("accepts splits that sum to the total", () => {
    expect(validateCustomSplit(1000, [500, 300, 200])).toEqual([500, 300, 200]);
  });

  it("rejects splits that do not sum to the total", () => {
    expect(() => validateCustomSplit(1000, [500, 300, 100])).toThrow();
  });

  it("rejects negative or non-integer shares", () => {
    expect(() => validateCustomSplit(100, [-50, 150])).toThrow();
    expect(() => validateCustomSplit(100, [50.5, 49.5])).toThrow();
  });
});

describe("splitPercentage", () => {
  it("splits accurately based on percentages", () => {
    const shares = splitPercentage(10000, [50, 30, 20]);
    expect(shares).toEqual([5000, 3000, 2000]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("handles remainder penny distribution on fractional percentages", () => {
    const shares = splitPercentage(10000, [33.33, 33.33, 33.34]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    expect(shares).toEqual([3333, 3333, 3334]);
  });

  it("rejects percentages not summing to 100", () => {
    expect(() => splitPercentage(1000, [50, 40])).toThrow();
    expect(() => splitPercentage(1000, [50, 50, 10])).toThrow();
  });
});

describe("splitShares", () => {
  it("splits accurately based on weights", () => {
    const shares = splitShares(10000, [2, 1, 1]);
    expect(shares).toEqual([5000, 2500, 2500]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("distributes remainders so sum matches total", () => {
    const shares = splitShares(1000, [1, 1, 1]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(shares).toEqual([334, 333, 333]);
  });

  it("rejects non-positive weights", () => {
    expect(() => splitShares(1000, [0, 1])).toThrow();
    expect(() => splitShares(1000, [-1, 2])).toThrow();
  });
});

