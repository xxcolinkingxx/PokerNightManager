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
  const sorted = [...chips].filter((chip) => chip.value > 0).sort((a, b) => b.value - a.value);
  let remaining = Math.max(0, Math.round(amount));
  const counts: ChipCount[] = [];

  for (const chip of sorted) {
    const count = Math.floor(remaining / chip.value);
    if (count > 0) {
      counts.push({ chip, count });
      remaining -= count * chip.value;
    }
  }

  return { counts, remainder: remaining };
}

export function sumChipCounts(counts: ChipCount[]): number {
  return counts.reduce((sum, { chip, count }) => sum + chip.value * count, 0);
}
