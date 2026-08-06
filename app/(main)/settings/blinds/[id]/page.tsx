"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { BlindLevelRow } from "@/components/blinds/blind-level-row";
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
import {
  blindStructureFormSchema,
  type BlindStructureFormInput,
  type BlindStructureFormValues,
} from "@/lib/blinds/schemas";
import { useBlindStructureStore } from "@/stores/blind-structure-store";

export default function BlindStructureEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const blindStructures = useBlindStructureStore((s) => s.blindStructures);
  const loadBlindStructures = useBlindStructureStore((s) => s.loadBlindStructures);
  const updateBlindStructure = useBlindStructureStore((s) => s.updateBlindStructure);
  const removeBlindStructure = useBlindStructureStore((s) => s.removeBlindStructure);

  const [structuresReady, setStructuresReady] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadBlindStructures().then(() => {
      if (!cancelled) setStructuresReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadBlindStructures]);

  const structure = blindStructures.find((s) => s.id === params.id);

  // All three generics matter here, same reasoning as the chip set form:
  // specifying only the input type would silently default the
  // submit-callback type back to the input shape too, instead of
  // inferring the coerced output shape from the resolver.
  const form = useForm<BlindStructureFormInput, unknown, BlindStructureFormValues>({
    resolver: zodResolver(blindStructureFormSchema),
    defaultValues: { name: "", levels: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "levels" });

  useEffect(() => {
    if (structure) {
      form.reset({ name: structure.name, levels: structure.levels });
    }
  }, [structure, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    // Levels must stay a contiguous 1..N sequence for the live blind
    // timer's "find the next level" logic -- derived from row order
    // rather than trusted from user input, so there's no way to save a
    // gap or duplicate.
    const levels = values.levels.map((level, index) => ({ ...level, level: index + 1 }));
    await updateBlindStructure(params.id, { name: values.name, levels });
    setIsSaving(false);
  });

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await removeBlindStructure(params.id);
      router.push("/settings/blinds");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Couldn't delete this structure");
      setIsDeleting(false);
    }
  }

  if (!structuresReady) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading blind structure...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  if (!structure) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Blind structure not found</h2>
              <Button onClick={() => router.push("/settings/blinds")}>
                Back to Blind Structures
              </Button>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/settings/blinds")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to blind structures"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 truncate text-lg font-semibold text-foreground">
            {structure.name}
          </span>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete blind structure"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="blind-structure-name">Name</Label>
            <Input id="blind-structure-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <BlindLevelRow
                key={field.id}
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
            onClick={() => {
              // useFieldArray's `fields` only tracks row identity/order, not
              // the live typed value of an uncontrolled register()'d input
              // -- reading current values needs getValues(), not `fields`,
              // or doubling would double whatever the *default* value was
              // regardless of what the user actually typed.
              const lastIndex = fields.length - 1;
              const last = lastIndex >= 0 ? form.getValues(`levels.${lastIndex}`) : undefined;
              append({
                level: fields.length + 1,
                smallBlind: last ? Number(last.smallBlind) * 2 : 1,
                bigBlind: last ? Number(last.bigBlind) * 2 : 2,
                ante: last ? Number(last.ante) : 0,
                durationMinutes: last ? Number(last.durationMinutes) : 20,
              });
            }}
          >
            <Plus className="h-4 w-4" />
            Add Level
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </AnimatedPage>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Delete {structure.name}?</SheetTitle>
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
