"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { resizeImageToBlob } from "@/lib/players/avatar";
import type { Player } from "@/lib/session/types";
import { usePlayerStore } from "@/stores/player-store";

const editPlayerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  nickname: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  venmo: z.string().max(50).optional(),
  cashApp: z.string().max(50).optional(),
  appleCash: z.string().max(50).optional(),
  zelle: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

type EditPlayerValues = z.infer<typeof editPlayerSchema>;

interface EditPlayerSheetProps {
  player: Player;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerSheet({ player, open, onOpenChange }: EditPlayerSheetProps) {
  const updatePlayer = usePlayerStore((s) => s.updatePlayer);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarBlob, setAvatarBlob] = useState<Blob | undefined>(player.avatar);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const form = useForm<EditPlayerValues>({
    resolver: zodResolver(editPlayerSchema),
    defaultValues: {
      name: player.name,
      nickname: player.nickname,
      phone: player.phone ?? "",
      venmo: player.venmo ?? "",
      cashApp: player.cashApp ?? "",
      appleCash: player.appleCash ?? "",
      zelle: player.zelle ?? "",
      notes: player.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: player.name,
        nickname: player.nickname,
        phone: player.phone ?? "",
        venmo: player.venmo ?? "",
        cashApp: player.cashApp ?? "",
        appleCash: player.appleCash ?? "",
        zelle: player.zelle ?? "",
        notes: player.notes ?? "",
      });
      setAvatarBlob(player.avatar);
    }
  }, [open, player, form]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const resized = await resizeImageToBlob(file);
      setAvatarBlob(resized);
    } finally {
      setIsProcessingImage(false);
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await updatePlayer(player.id, {
      name: values.name,
      nickname: values.nickname?.trim() || values.name,
      phone: values.phone,
      venmo: values.venmo,
      cashApp: values.cashApp,
      appleCash: values.appleCash,
      zelle: values.zelle,
      notes: values.notes,
      avatar: avatarBlob,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[90dvh] flex-col overflow-hidden px-0">
        <SheetHeader>
          <SheetTitle>Edit Player</SheetTitle>
          <SheetDescription>Update contact info, payment handles, and notes.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <PlayerAvatar
                name={form.watch("nickname") || form.watch("name") || "?"}
                avatar={avatarBlob}
                className="h-20 w-20 text-lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-background shadow-sm disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              {avatarBlob && (
                <button
                  type="button"
                  onClick={() => setAvatarBlob(undefined)}
                  aria-label="Remove photo"
                  className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Player photo"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
              />
            </div>
            {isProcessingImage && (
              <span className="text-xs text-muted-foreground">Processing photo...</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-nickname">Nickname</Label>
            <Input id="edit-nickname" {...form.register("nickname")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" type="tel" {...form.register("phone")} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-venmo">Venmo</Label>
              <Input id="edit-venmo" placeholder="@handle" {...form.register("venmo")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-cashapp">Cash App</Label>
              <Input id="edit-cashapp" placeholder="$cashtag" {...form.register("cashApp")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-applecash">Apple Cash</Label>
              <Input id="edit-applecash" {...form.register("appleCash")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-zelle">Zelle</Label>
              <Input id="edit-zelle" {...form.register("zelle")} />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" rows={3} {...form.register("notes")} />
          </div>

          <SheetFooter className="px-0 pb-6">
            <Button type="submit" disabled={form.formState.isSubmitting || isProcessingImage}>
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
