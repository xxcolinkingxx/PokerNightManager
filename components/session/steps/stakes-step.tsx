"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stakesStepSchema } from "@/lib/session/schemas";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

export function StakesStep() {
  const data = useWizardStore((s) => s.data);
  const updateData = useWizardStore((s) => s.updateData);
  const setStep = useWizardStore((s) => s.setStep);

  // No explicit generic: z.coerce.number() makes the schema's input type
  // `unknown` (pre-coercion) and output type `number` (post-coercion), and
  // letting useForm infer both from the resolver keeps them correctly
  // distinct instead of forcing TFieldValues to the coerced output type.
  const form = useForm({
    resolver: zodResolver(stakesStepSchema),
    defaultValues: { buyIn: data.buyIn, startingStack: data.startingStack },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateData(values);
    setStep("chip-set");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <WizardStepHeader title="Stakes" subtitle="Set the buy-in and starting stack." />

      <div className="flex flex-col gap-2">
        <Label htmlFor="buyIn">Buy-In ($)</Label>
        <Input
          id="buyIn"
          type="number"
          inputMode="decimal"
          min={1}
          step="1"
          {...form.register("buyIn")}
        />
        {form.formState.errors.buyIn && (
          <p className="text-xs text-danger">{form.formState.errors.buyIn.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startingStack">Starting Stack</Label>
        <Input
          id="startingStack"
          type="number"
          inputMode="numeric"
          min={1}
          step="1"
          {...form.register("startingStack")}
        />
        {form.formState.errors.startingStack && (
          <p className="text-xs text-danger">{form.formState.errors.startingStack.message}</p>
        )}
      </div>

      <WizardStepFooter onBack={() => setStep("game-type")} submitLabel="Continue" />
    </form>
  );
}
