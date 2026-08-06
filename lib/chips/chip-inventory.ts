import { calculateChipDistribution } from "./chip-calculator";
import type { ChipDefinition, ChipSet } from "@/lib/session/types";

export interface ChipInventoryRow {
  chip: ChipDefinition;
  owned: number;
  inPlay: number;
  remaining: number;
  isShort: boolean;
}

export function computeChipInventoryStatus(
  chipSet: ChipSet,
  inPlayAmount: number,
): ChipInventoryRow[] {
  const { counts } = calculateChipDistribution(inPlayAmount, chipSet.chips);
  const inPlayByValue = new Map(counts.map(({ chip, count }) => [chip.value, count]));

  return [...chipSet.chips]
    .sort((a, b) => b.value - a.value)
    .map((chip) => {
      const inPlay = inPlayByValue.get(chip.value) ?? 0;
      const remaining = chip.quantityOwned - inPlay;
      return {
        chip,
        owned: chip.quantityOwned,
        inPlay,
        remaining: Math.max(0, remaining),
        isShort: remaining < 0,
      };
    });
}
