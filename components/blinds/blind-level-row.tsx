"use client";

import { X } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import type { BlindStructureFormInput } from "@/lib/blinds/schemas";

interface BlindLevelRowProps {
  register: UseFormRegister<BlindStructureFormInput>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function BlindLevelRow({ register, index, onRemove, canRemove }: BlindLevelRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Level {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove level ${index + 1}`}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Small Blind ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label={`Level ${index + 1} small blind`}
            {...register(`levels.${index}.smallBlind`)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Big Blind ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label={`Level ${index + 1} big blind`}
            {...register(`levels.${index}.bigBlind`)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ante ($)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label={`Level ${index + 1} ante`}
            {...register(`levels.${index}.ante`)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Duration (min)</span>
          <Input
            type="number"
            inputMode="numeric"
            aria-label={`Level ${index + 1} duration in minutes`}
            {...register(`levels.${index}.durationMinutes`)}
          />
        </div>
      </div>
    </div>
  );
}
