"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { detailsStepSchema, type DetailsStepValues } from "@/lib/session/schemas";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

export function DetailsStep() {
  const data = useWizardStore((s) => s.data);
  const updateData = useWizardStore((s) => s.updateData);
  const setStep = useWizardStore((s) => s.setStep);

  const form = useForm<DetailsStepValues>({
    resolver: zodResolver(detailsStepSchema),
    defaultValues: {
      name: data.name,
      host: data.host,
      location: data.location,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateData(values);
    setStep("game-type");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <WizardStepHeader title="Session Details" subtitle="Give this poker night a name." />

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Session Name</Label>
        <Input id="name" placeholder="Friday Night Poker" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="host">Host</Label>
        <Input id="host" placeholder="Colin" {...form.register("host")} />
        {form.formState.errors.host && (
          <p className="text-xs text-danger">{form.formState.errors.host.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="Home game room" {...form.register("location")} />
        {form.formState.errors.location && (
          <p className="text-xs text-danger">{form.formState.errors.location.message}</p>
        )}
      </div>

      <WizardStepFooter submitLabel="Continue" isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
