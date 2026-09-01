import { describe, it, expect } from "vitest";
import { splitEqual, validateCustomSplit } from "../src/services/splitCalculator.js";

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
