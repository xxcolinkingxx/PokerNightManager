"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { ChipCalculatorCard } from "@/components/chip/chip-calculator-card";
import { ChipDenominationRow } from "@/components/chip/chip-denomination-row";
import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { computeChipInventoryStatus } from "@/lib/chips/chip-inventory";
import { chipSetFormSchema, type ChipSetFormInput, type ChipSetFormValues } from "@/lib/chips/schemas";
import { getInPlayAmountForChipSet } from "@/lib/chips/services/chip-inventory-service";
import { formatCurrency } from "@/lib/session/services/session-engine";
import { cn } from "@/lib/utils";
import { useChipStore } from "@/stores/chip-store";

export default function ChipSetEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const chipSets = useChipStore((s) => s.chipSets);
  const loadChipSets = useChipStore((s) => s.loadChipSets);
  const updateChipSet = useChipStore((s) => s.updateChipSet);
  const removeChipSet = useChipStore((s) => s.removeChipSet);

  const [chipSetsReady, setChipSetsReady] = useState(false);
  const [inPlayAmount, setInPlayAmount] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadChipSets().then(() => {
      if (!cancelled) setChipSetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadChipSets]);

  useEffect(() => {
    let cancelled = false;
    getInPlayAmountForChipSet(params.id).then((amount) => {
      if (!cancelled) setInPlayAmount(amount);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const chipSet = chipSets.find((c) => c.id === params.id);

  // All three generics matter here: specifying only the input type would
  // silently default the submit-callback type (3rd) back to the input
  // shape too, instead of inferring the coerced output shape from the
  // resolver.
  const form = useForm<ChipSetFormInput, unknown, ChipSetFormValues>({
    resolver: zodResolver(chipSetFormSchema),
    defaultValues: { name: "", chips: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "chips" });

  useEffect(() => {
    if (chipSet) {
      form.reset({ name: chipSet.name, chips: chipSet.chips });
    }
  }, [chipSet, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    await updateChipSet(params.id, { name: values.name, chips: values.chips });
    setIsSaving(false);
  });

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await removeChipSet(params.id);
      router.push("/settings/chips");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete this chip set");
      setIsDeleting(false);
    }
  }

  if (!chipSetsReady) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading chip set...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  if (!chipSet) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Chip set not found</h2>
              <Button onClick={() => router.push("/settings/chips")}>Back to Chip Sets</Button>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const inventory = computeChipInventoryStatus(chipSet, inPlayAmount);

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/settings/chips")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to chip sets"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 truncate text-lg font-semibold text-foreground">
            {chipSet.name}
          </span>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete chip set"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="chip-set-name">Name</Label>
            <Input id="chip-set-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <ChipDenominationRow
                key={field.id}
                control={form.control}
                register={form.register}
                index={index}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              append({ color: "#F5F5F5", label: "New Chip", value: 1, quantityOwned: 0 })
            }
          >
            <Plus className="h-4 w-4" />
            Add Denomination
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>

        <ChipCalculatorCard chips={chipSet.chips} />

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <span className="text-sm font-semibold text-foreground">Inventory</span>
            {inventory.map((row) => (
              <div key={row.chip.value} className="flex items-center gap-3 text-sm">
                <span
                  className="h-5 w-5 shrink-0 rounded-full border-2 border-border"
                  style={{ backgroundColor: row.chip.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-foreground">{row.chip.label}</span>
                <span className="text-xs text-muted-foreground">
                  {row.owned} owned · {row.inPlay} in play
                </span>
                <span
                  className={cn(
                    "w-24 text-right font-medium",
                    row.isShort ? "text-danger" : "text-foreground",
                  )}
                >
                  {row.isShort
                    ? `Short ${Math.abs(row.owned - row.inPlay)}`
                    : `${row.remaining} left`}
                </span>
              </div>
            ))}
            {inPlayAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(inPlayAmount)} currently in play across active sessions.
              </p>
            )}
          </CardContent>
        </Card>
      </AnimatedPage>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Delete {chipSet.name}?</SheetTitle>
            <SheetDescription>This can&apos;t be undone.</SheetDescription>
          </SheetHeader>
          {deleteError && <p className="px-6 text-sm text-danger">{deleteError}</p>}
          <SheetFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
