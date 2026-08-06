"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, Trophy } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { gameTypeStepSchema, type GameTypeStepValues } from "@/lib/session/schemas";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

const OPTIONS = [
  {
    value: "cash" as const,
    label: "Cash Game",
    description: "Buy in, cash out anytime.",
    icon: Coins,
  },
  {
    value: "tournament" as const,
    label: "Tournament",
    description: "Fixed buy-in, last player standing.",
    icon: Trophy,
  },
];

export function GameTypeStep() {
  const data = useWizardStore((s) => s.data);
  const updateData = useWizardStore((s) => s.updateData);
  const setStep = useWizardStore((s) => s.setStep);

  const { control, handleSubmit } = useForm<GameTypeStepValues>({
    resolver: zodResolver(gameTypeStepSchema),
    defaultValues: { type: data.type },
  });

  const onSubmit = handleSubmit((values) => {
    updateData(values);
    setStep("stakes");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <WizardStepHeader title="Game Type" subtitle="How are you playing tonight?" />

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange}>
            {OPTIONS.map(({ value, label, description, icon: Icon }) => (
              <Label
                key={value}
                htmlFor={`type-${value}`}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 has-[[data-state=checked]]:border-gold has-[[data-state=checked]]:bg-gold/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
                <RadioGroupItem value={value} id={`type-${value}`} />
              </Label>
            ))}
          </RadioGroup>
        )}
      />

      <WizardStepFooter onBack={() => setStep("details")} submitLabel="Continue" />
    </form>
  );
}
