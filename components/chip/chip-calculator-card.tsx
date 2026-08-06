"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateChipDistribution } from "@/lib/chips/chip-calculator";
import { formatCurrency } from "@/lib/session/services/session-engine";
import { cn } from "@/lib/utils";
import type { ChipDefinition } from "@/lib/session/types";

interface ChipCalculatorCardProps {
  chips: ChipDefinition[];
}

function suggest(chips: ChipDefinition[], amount: number): Record<number, number> {
  const { counts } = calculateChipDistribution(amount, chips);
  return Object.fromEntries(counts.map(({ chip, count }) => [chip.value, count]));
}

export function ChipCalculatorCard({ chips }: ChipCalculatorCardProps) {
  const [amount, setAmount] = useState("");
  const numericAmount = Number(amount) || 0;
  const sorted = [...chips].filter((chip) => chip.value > 0).sort((a, b) => b.value - a.value);

  // Re-anchor the manual counts to a fresh suggestion whenever the typed
  // amount changes (mirrors the timer hooks' baseline-during-render
  // pattern), so the user can freely nudge individual chip counts
  // afterward without every keystroke wiping out their edits.
  const [state, setState] = useState(() => ({
    amount: numericAmount,
    counts: suggest(sorted, numericAmount),
  }));
  if (state.amount !== numericAmount) {
    setState({ amount: numericAmount, counts: suggest(sorted, numericAmount) });
  }

  // Auto-balance: nudging one chip's count re-suggests every other
  // denomination so the total keeps matching the amount, instead of just
  // reporting how far off it drifted.
  function adjust(value: number, delta: number) {
    setState((prev) => {
      const touchedChip = sorted.find((chip) => chip.value === value);
      if (!touchedChip) return prev;

      const newCount = Math.max(0, (prev.counts[value] ?? 0) + delta);
      const touchedTotal = touchedChip.value * newCount;
      const remainderTarget = Math.max(0, numericAmount - touchedTotal);
      const otherChips = sorted.filter((chip) => chip.value !== value);
      const { counts: rebalanced } = calculateChipDistribution(remainderTarget, otherChips);

      const counts: Record<number, number> = { [value]: newCount };
      for (const { chip, count } of rebalanced) {
        counts[chip.value] = count;
      }
      return { ...prev, counts };
    });
  }

  function handleReset() {
    setState({ amount: numericAmount, counts: suggest(sorted, numericAmount) });
  }

  const total = sorted.reduce(
    (sum, chip) => sum + chip.value * (state.counts[chip.value] ?? 0),
    0,
  );
  const diff = total - numericAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chip Calculator</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="calc-amount">Amount ($)</Label>
          <Input
            id="calc-amount"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 75"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {numericAmount > 0 && (
          <div className="flex flex-col gap-3">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">This chip set has no denominations.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Adjust as needed</span>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" onClick={handleReset}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Suggested
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {sorted.map((chip) => {
                    const count = state.counts[chip.value] ?? 0;
                    return (
                      <div key={chip.value} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border-2 border-border"
                          style={{ backgroundColor: chip.color }}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate text-foreground">{chip.label}</span>
                        <button
                          type="button"
                          onClick={() => adjust(chip.value, -1)}
                          disabled={count === 0}
                          aria-label={`Remove one ${chip.label} chip`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 shrink-0 text-center font-medium text-foreground">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjust(chip.value, 1)}
                          aria-label={`Add one ${chip.label} chip`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-white/[0.06]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-16 shrink-0 text-right font-medium text-foreground">
                          {formatCurrency(chip.value * count)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-semibold",
                        diff === 0 && "text-success",
                        diff > 0 && "text-danger",
                        diff < 0 && "text-foreground",
                      )}
                    >
                      {formatCurrency(total)}
                    </span>
                    {diff !== 0 && (
                      <span className={cn("text-xs", diff > 0 ? "text-danger" : "text-muted-foreground")}>
                        ({diff > 0 ? "over by " : "remaining "}
                        {formatCurrency(Math.abs(diff))})
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
