"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
import { addHostInvite } from "@/lib/invites/host-invite-log";
import { createInviteSchema } from "@/lib/invites/schemas";
import type { GameInvite } from "@/lib/invites/types";

type FormInput = z.input<typeof createInviteSchema>;
type FormValues = z.output<typeof createInviteSchema>;

interface CreateInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHostName?: string;
  defaultLocation?: string;
}

function todayDateInputValue(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function CreateInviteSheet({
  open,
  onOpenChange,
  defaultHostName = "",
  defaultLocation = "",
}: CreateInviteSheetProps) {
  const [invite, setInvite] = useState<GameInvite | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Same three-generic shape as the blind structure form: the input type
  // drives register()'d fields, the output type is what the resolver
  // hands to onSubmit after buyIn gets coerced from a string.
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      gameName: "",
      hostName: defaultHostName,
      date: todayDateInputValue(),
      location: defaultLocation,
      buyIn: "",
    },
  });

  // Adjust state during render rather than in an effect (same pattern as
  // useSessionTimer's baseline re-anchoring): the sheet's own instance
  // never unmounts on close, so a plain effect would fire a second,
  // avoidable render every time it reopens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setInvite(null);
      setSubmitError(null);
      setCopied(false);
      form.reset({
        gameName: "",
        hostName: defaultHostName,
        date: todayDateInputValue(),
        location: defaultLocation,
        buyIn: "",
      });
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't create the invite");
      }
      const created = data as GameInvite;
      addHostInvite({
        id: created.id,
        gameName: created.gameName,
        date: created.date,
        createdAt: created.createdAt,
      });
      setInvite(created);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Couldn't create the invite");
    } finally {
      setIsSubmitting(false);
    }
  });

  const inviteUrl =
    invite && typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.id}` : "";

  async function handleShare() {
    if (!invite) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: invite.gameName, url: inviteUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await handleCopy();
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        {invite ? (
          <>
            <SheetHeader>
              <SheetTitle>Invite is ready</SheetTitle>
              <SheetDescription>
                Share this link -- guests can RSVP without an account or the app.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-6">
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground break-all">
                {inviteUrl}
              </div>
            </div>
            <SheetFooter>
              <Button variant="secondary" onClick={() => void handleCopy()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button onClick={() => void handleShare()}>
                <Send className="h-4 w-4" />
                Share
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Invite Guests</SheetTitle>
              <SheetDescription>
                Create a shareable link. Guests can RSVP with no login or install.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-game-name">Game Name</Label>
                <Input
                  id="invite-game-name"
                  placeholder="Friday Night Poker"
                  {...form.register("gameName")}
                />
                {form.formState.errors.gameName && (
                  <p className="text-xs text-danger">{form.formState.errors.gameName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-host-name">Host Name</Label>
                <Input id="invite-host-name" {...form.register("hostName")} />
                {form.formState.errors.hostName && (
                  <p className="text-xs text-danger">{form.formState.errors.hostName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-date">Date</Label>
                <Input id="invite-date" type="date" {...form.register("date")} />
                {form.formState.errors.date && (
                  <p className="text-xs text-danger">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-location">Location</Label>
                <Input id="invite-location" placeholder="Colin's place" {...form.register("location")} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-buy-in">Buy-In (optional)</Label>
                <Input
                  id="invite-buy-in"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="TBD"
                  {...form.register("buyIn")}
                />
              </div>

              {submitError && <p className="text-sm text-danger">{submitError}</p>}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invite Link"}
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
