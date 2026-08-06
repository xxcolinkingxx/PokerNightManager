"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
import { usePlayerStore } from "@/stores/player-store";

const addPlayerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  nickname: z.string().max(100).optional(),
});

type AddPlayerValues = z.infer<typeof addPlayerSchema>;

interface AddPlayerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerSheet({ open, onOpenChange }: AddPlayerSheetProps) {
  const addPlayer = usePlayerStore((s) => s.addPlayer);

  const form = useForm<AddPlayerValues>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: { name: "", nickname: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await addPlayer(values.name, values.nickname);
    form.reset();
    onOpenChange(false);
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add Player</SheetTitle>
          <SheetDescription>Add a regular to your player database.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="player-name">Name</Label>
            <Input id="player-name" placeholder="Jane Doe" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="player-nickname">Nickname (optional)</Label>
            <Input id="player-nickname" placeholder="Ace" {...form.register("nickname")} />
          </div>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Add Player
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
