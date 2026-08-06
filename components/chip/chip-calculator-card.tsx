"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateChipDistribution } from "@/lib/chips/chip-calculator";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { ChipDefinition } from "@/lib/session/types";

interface ChipCalculatorCardProps {
  chips: ChipDefinition[];
}

export function ChipCalculatorCard({ chips }: ChipCalculatorCardProps) {
  const [amount, setAmount] = useState("");
  const numericAmount = Number(amount) || 0;
  const { counts, remainder } = calculateChipDistribution(numericAmount, chips);

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
          <div className="flex flex-col gap-2">
            {counts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chips fit this amount.</p>
            ) : (
              counts.map(({ chip, count }) => (
                <div key={chip.value} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border-2 border-border"
                    style={{ backgroundColor: chip.color }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-foreground">{chip.label}</span>
                  <span className="text-muted-foreground">×{count}</span>
                  <span className="w-16 text-right font-medium text-foreground">
                    {formatCurrency(chip.value * count)}
                  </span>
                </div>
              ))
            )}
            {remainder > 0 && (
              <p className="text-xs text-danger">
                {formatCurrency(remainder)} can&apos;t be represented with these chips.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
