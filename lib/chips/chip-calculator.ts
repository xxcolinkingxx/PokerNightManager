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

// How many of the two smallest denominations ("whites and reds" in the
// default set) a suggestion will pile on beyond their baseline reserve --
// real racks lean heavily on the small chips for change-making, so these
// should noticeably outnumber the bigger denominations.
const PREFERRED_DENOMINATION_CAPS = [8, 5];

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

  // Top up the smallest one or two denominations beyond their single
  // reserved chip, up to a cap, before anything else gets more.
  ascending.slice(0, PREFERRED_DENOMINATION_CAPS.length).forEach((chip, index) => {
    const cap = PREFERRED_DENOMINATION_CAPS[index];
    const already = byValue.get(chip.value) ?? 0;
    const additional = Math.min(cap - already, Math.floor(remaining / chip.value));
    if (additional > 0) {
      byValue.set(chip.value, already + additional);
      remaining -= additional * chip.value;
    }
  });

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
