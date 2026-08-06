import type { ChipDefinition } from "@/lib/session/types";

export interface ChipCount {
  chip: ChipDefinition;
  count: number;
}

export interface ChipDistributionResult {
  counts: ChipCount[];
  // Amount left over that couldn't be represented with the available
  // denominations (e.g. no $1 chip and an amount that isn't a multiple of
  // the smallest one). Surfaced rather than silently dropped.
  remainder: number;
}

export function calculateChipDistribution(
  amount: number,
  chips: ChipDefinition[],
): ChipDistributionResult {
  const descending = [...chips].filter((chip) => chip.value > 0).sort((a, b) => b.value - a.value);
  const ascending = [...descending].sort((a, b) => a.value - b.value);
  const total = Math.max(0, Math.round(amount));
  let remaining = total;
  const byValue = new Map<number, number>();

  // Reserve one of each denomination, smallest first, as long as it still
  // fits -- this is what makes the suggestion use a variety of chips
  // instead of the fewest possible (which a pure largest-first greedy
  // pass would produce, e.g. a single $50 for $50 owed).
  for (const chip of ascending) {
    if (chip.value <= remaining) {
      byValue.set(chip.value, (byValue.get(chip.value) ?? 0) + 1);
      remaining -= chip.value;
    }
  }

  // Fill whatever is left with a standard largest-first greedy pass.
  for (const chip of descending) {
    const count = Math.floor(remaining / chip.value);
    if (count > 0) {
      byValue.set(chip.value, (byValue.get(chip.value) ?? 0) + count);
      remaining -= count * chip.value;
    }
  }

  const counts: ChipCount[] = descending
    .filter((chip) => (byValue.get(chip.value) ?? 0) > 0)
    .map((chip) => ({ chip, count: byValue.get(chip.value)! }));

  return { counts, remainder: remaining };
}

export function sumChipCounts(counts: ChipCount[]): number {
  return counts.reduce((sum, { chip, count }) => sum + chip.value * count, 0);
}
