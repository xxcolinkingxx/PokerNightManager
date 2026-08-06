import { describe, expect, it } from "vitest";

import { calculateChipDistribution, sumChipCounts } from "./chip-calculator";
import { DEFAULT_CHIP_DENOMINATIONS } from "@/lib/session/constants";
import type { ChipDefinition } from "@/lib/session/types";

const DEFAULT_CHIPS: ChipDefinition[] = DEFAULT_CHIP_DENOMINATIONS.map((chip) => ({
  ...chip,
  quantityOwned: 0,
}));

function countsAsMap(counts: ReturnType<typeof calculateChipDistribution>["counts"]) {
  return Object.fromEntries(counts.map(({ chip, count }) => [chip.value, count]));
}

describe("calculateChipDistribution", () => {
  it("spreads a mid-size amount across small denominations instead of a couple big chips", () => {
    const { counts, remainder } = calculateChipDistribution(75, DEFAULT_CHIPS);
    expect(remainder).toBe(0);
    expect(sumChipCounts(counts)).toBe(75);
    // Regression guard: this used to resolve to a single Blue + Green chip.
    expect(countsAsMap(counts)).toEqual({ 1: 10, 5: 8, 25: 1 });
  });

  it("doesn't dump a small amount entirely into the smallest denomination", () => {
    const { counts, remainder } = calculateChipDistribution(7, DEFAULT_CHIPS);
    expect(remainder).toBe(0);
    expect(sumChipCounts(counts)).toBe(7);
    expect(countsAsMap(counts)).toEqual({ 1: 2, 5: 1 });
  });

  it("uses every denomination for a large amount", () => {
    const { counts, remainder } = calculateChipDistribution(500, DEFAULT_CHIPS);
    expect(remainder).toBe(0);
    expect(sumChipCounts(counts)).toBe(500);
    const byValue = countsAsMap(counts);
    expect(Object.keys(byValue)).toHaveLength(5);
    // Small denominations should outnumber the big ones by chip count.
    expect(byValue[1]).toBeGreaterThan(byValue[100]);
    expect(byValue[5]).toBeGreaterThan(byValue[50]);
  });

  it("reports a remainder when the amount can't be exactly represented", () => {
    const chips: ChipDefinition[] = [{ color: "#fff", value: 5, label: "Red", quantityOwned: 0 }];
    const { counts, remainder } = calculateChipDistribution(12, chips);
    expect(sumChipCounts(counts)).toBe(10);
    expect(remainder).toBe(2);
  });

  it("returns nothing for a zero or negative amount", () => {
    expect(calculateChipDistribution(0, DEFAULT_CHIPS)).toEqual({ counts: [], remainder: 0 });
    expect(calculateChipDistribution(-10, DEFAULT_CHIPS)).toEqual({ counts: [], remainder: 0 });
  });

  it("returns an empty result when there are no denominations", () => {
    expect(calculateChipDistribution(75, [])).toEqual({ counts: [], remainder: 75 });
  });

  it("ignores non-positive-value denominations", () => {
    const chips: ChipDefinition[] = [
      { color: "#fff", value: 0, label: "Free", quantityOwned: 0 },
      { color: "#f00", value: 5, label: "Red", quantityOwned: 0 },
    ];
    const { counts } = calculateChipDistribution(10, chips);
    expect(countsAsMap(counts)).toEqual({ 5: 2 });
  });
});

describe("sumChipCounts", () => {
  it("sums chip value times count", () => {
    const counts = [
      { chip: DEFAULT_CHIPS[0], count: 3 },
      { chip: DEFAULT_CHIPS[2], count: 2 },
    ];
    expect(sumChipCounts(counts)).toBe(3 * 1 + 2 * 25);
  });

  it("returns 0 for an empty list", () => {
    expect(sumChipCounts([])).toBe(0);
  });
});
