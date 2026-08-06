"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { chipSetStepSchema, type ChipSetStepValues } from "@/lib/session/schemas";
import { useChipStore } from "@/stores/chip-store";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

export function ChipSetStep() {
  const data = useWizardStore((s) => s.data);
  const updateData = useWizardStore((s) => s.updateData);
  const setStep = useWizardStore((s) => s.setStep);

  const chipSets = useChipStore((s) => s.chipSets);
  const loadChipSets = useChipStore((s) => s.loadChipSets);

  useEffect(() => {
    void loadChipSets();
  }, [loadChipSets]);

  const { control, handleSubmit } = useForm<ChipSetStepValues>({
    resolver: zodResolver(chipSetStepSchema),
    defaultValues: { chipSetId: data.chipSetId },
  });

  const onSubmit = handleSubmit((values) => {
    updateData(values);
    setStep("blinds");
  });

  if (chipSets.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <WizardStepHeader title="Chip Set" subtitle="Pick the chips you're playing with." />
        <p className="text-sm text-muted-foreground">Loading chip sets...</p>
        <WizardStepFooter onBack={() => setStep("stakes")} submitLabel="Continue" disabled />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <WizardStepHeader title="Chip Set" subtitle="Pick the chips you're playing with." />

      <Controller
        control={control}
        name="chipSetId"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange}>
            {chipSets.map((set) => (
              <Label
                key={set.id}
                htmlFor={`chip-${set.id}`}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">{set.name}</span>
                  <div className="flex items-center gap-2">
                    {set.chips.map((chip) => (
                      <span
                        key={chip.value}
                        className="h-7 w-7 rounded-full border-2 border-border"
                        style={{ backgroundColor: chip.color }}
                        title={`${chip.label} — $${chip.value}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <RadioGroupItem value={set.id} id={`chip-${set.id}`} />
              </Label>
            ))}
          </RadioGroup>
        )}
      />

      <WizardStepFooter onBack={() => setStep("stakes")} submitLabel="Continue" />
    </form>
  );
}
