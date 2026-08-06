"use client";

import { X } from "lucide-react";
import { Controller, type Control, type UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { CHIP_COLOR_PALETTE } from "@/lib/session/constants";
import type { ChipSetFormInput } from "@/lib/chips/schemas";
import { cn } from "@/lib/utils";

interface ChipDenominationRowProps {
  control: Control<ChipSetFormInput>;
  register: UseFormRegister<ChipSetFormInput>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function ChipDenominationRow({
  control,
  register,
  index,
  onRemove,
  canRemove,
}: ChipDenominationRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={`chips.${index}.color`}
          render={({ field }) => (
            <>
              {CHIP_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.onChange(color)}
                  aria-label={`Use color ${color}`}
                  aria-pressed={field.value === color}
                  className={cn(
                    "h-6 w-6 shrink-0 rounded-full border-2 transition-transform",
                    field.value === color ? "scale-110 border-gold" : "border-border",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </>
          )}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove denomination"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Label</span>
          <Input
            aria-label={`Chip ${index + 1} label`}
            {...register(`chips.${index}.label`)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Value ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label={`Chip ${index + 1} value in dollars`}
            {...register(`chips.${index}.value`)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Owned</span>
          <Input
            type="number"
            inputMode="numeric"
            aria-label={`Chip ${index + 1} quantity owned`}
            {...register(`chips.${index}.quantityOwned`)}
          />
        </div>
      </div>
    </div>
  );
}
