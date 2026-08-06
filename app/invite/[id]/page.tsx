"use client";

import { Check, Spade } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getOrCreateGuestToken } from "@/lib/invites/guest-identity";
import { summarizeRsvps } from "@/lib/invites/invite-logic";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { GameInvite, RsvpStatus } from "@/lib/invites/types";

type LoadState = "loading" | "not-found" | "error" | "ready";

const STATUS_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "in", label: "I'm in" },
  { value: "maybe", label: "Maybe" },
  { value: "out", label: "Can't make it" },
];

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvitePage() {
  const params = useParams<{ id: string }>();
  const inviteId = params.id;
  const guestTokenRef = useRef("");

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [invite, setInvite] = useState<GameInvite | null>(null);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("in");
  const [eta, setEta] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!inviteId) return;
    guestTokenRef.current = getOrCreateGuestToken(inviteId);

    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/invites/${inviteId}`);
        if (cancelled) return;
        if (response.status === 404) {
          setLoadState("not-found");
          return;
        }
        if (!response.ok) {
          setLoadState("error");
          return;
        }
        const data = (await response.json()) as GameInvite;
        const mine = data.rsvps.find((r) => r.guestToken === guestTokenRef.current);
        setInvite(data);
        if (mine) {
          setName(mine.name);
          setStatus(mine.status);
          setEta(mine.eta ?? "");
        }
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/invites/${inviteId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken: guestTokenRef.current,
          name,
          status,
          eta: eta.trim() === "" ? null : eta.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Couldn't save your RSVP");
      }
      setInvite(data as GameInvite);
      setJustSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save your RSVP");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadState === "loading") {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">Loading invite...</p>
      </Centered>
    );
  }

  if (loadState === "not-found") {
    return (
      <Centered>
        <Spade className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">Invite not found</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          This invite link is invalid or has expired.
        </p>
      </Centered>
    );
  }

  if (loadState === "error" || !invite) {
    return (
      <Centered>
        <p className="max-w-xs text-sm text-muted-foreground">
          Couldn&apos;t load this invite. Check your connection and try again.
        </p>
      </Centered>
    );
  }

  const summary = summarizeRsvps(invite);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
          <Spade className="h-7 w-7 text-gold" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {invite.gameName}
        </h1>
        <p className="text-sm text-muted-foreground">Hosted by {invite.hostName}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">{formatDateLabel(invite.date)}</span>
          </div>
          {invite.location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium text-foreground">{invite.location}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buy-In</span>
            <span className="font-medium text-foreground">
              {invite.buyIn === null ? "TBD" : formatCurrency(invite.buyIn)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex justify-around p-4 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-success">{summary.inCount}</span>
            <span className="text-xs text-muted-foreground">In</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-foreground">{summary.maybeCount}</span>
            <span className="text-xs text-muted-foreground">Maybe</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-muted-foreground">{summary.outCount}</span>
            <span className="text-xs text-muted-foreground">Out</span>
          </div>
        </CardContent>
      </Card>

      <form
        onSubmit={(event) => {
          setJustSaved(false);
          void handleSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="rsvp-name">Your Name</Label>
          <Input
            id="rsvp-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setJustSaved(false);
            }}
            placeholder="Your name"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Are you in?</Label>
          <RadioGroup
            value={status}
            onValueChange={(value) => {
              setStatus(value as RsvpStatus);
              setJustSaved(false);
            }}
            className="grid grid-cols-1 gap-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                htmlFor={`rsvp-status-${option.value}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <RadioGroupItem id={`rsvp-status-${option.value}`} value={option.value} />
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="rsvp-eta">ETA (optional)</Label>
          <Input
            id="rsvp-eta"
            value={eta}
            onChange={(event) => {
              setEta(event.target.value);
              setJustSaved(false);
            }}
            placeholder="e.g. around 7:30pm"
          />
        </div>

        {saveError && <p className="text-sm text-danger">{saveError}</p>}

        <Button type="submit" disabled={isSaving || name.trim() === ""}>
          {justSaved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : isSaving ? (
            "Saving..."
          ) : (
            "Save RSVP"
          )}
        </Button>
      </form>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      {children}
    </div>
  );
}
