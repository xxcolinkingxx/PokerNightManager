"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BLIND_STRUCTURES } from "@/lib/session/constants";
import { blindsStepSchema, type BlindsStepValues } from "@/lib/session/schemas";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

export function BlindsStep() {
  const data = useWizardStore((s) => s.data);
  const updateData = useWizardStore((s) => s.updateData);
  const setStep = useWizardStore((s) => s.setStep);

  const { control, handleSubmit } = useForm<BlindsStepValues>({
    resolver: zodResolver(blindsStepSchema),
    defaultValues: { blindStructureId: data.blindStructureId },
  });

  const onSubmit = handleSubmit((values) => {
    updateData(values);
    setStep("players");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <WizardStepHeader title="Blind Structure" subtitle="Choose how blinds escalate." />

      <Controller
        control={control}
        name="blindStructureId"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange}>
            {BLIND_STRUCTURES.map((structure) => {
              const first = structure.levels[0];
              const last = structure.levels[structure.levels.length - 1];
              return (
                <Label
                  key={structure.id}
                  htmlFor={`blind-${structure.id}`}
                  className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-card p-4 has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {structure.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {first.smallBlind}/{first.bigBlind} to {last.smallBlind}/{last.bigBlind}{" "}
                      · {first.durationMinutes}min levels
                    </span>
                  </div>
                  <RadioGroupItem value={structure.id} id={`blind-${structure.id}`} />
                </Label>
              );
            })}
          </RadioGroup>
        )}
      />

      <WizardStepFooter onBack={() => setStep("chip-set")} submitLabel="Continue" />
    </form>
  );
}
