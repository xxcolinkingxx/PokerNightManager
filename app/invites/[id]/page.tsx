"use client";

import { ArrowLeft, Check, Copy, Send, Spade, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { summarizeRsvps } from "@/lib/invites/invite-logic";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { GameInvite, RsvpStatus } from "@/lib/invites/types";
import { useSettingsStore } from "@/stores/settings-store";
import { useWizardStore } from "@/stores/session-store";

type LoadState = "loading" | "not-found" | "error" | "ready";

const STATUS_BADGE: Record<RsvpStatus, { label: string; variant: "success" | "default" | "secondary" }> = {
  in: { label: "In", variant: "success" },
  maybe: { label: "Maybe", variant: "default" },
  out: { label: "Out", variant: "secondary" },
};

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

function formatExpiryLabel(expiresAt: string): string {
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HostInviteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const inviteId = params.id;

  const settings = useSettingsStore((s) => s.settings);
  const wizardReset = useWizardStore((s) => s.reset);
  const wizardSetStep = useWizardStore((s) => s.setStep);
  const wizardSetOpen = useWizardStore((s) => s.setOpen);
  const wizardLoadPlayers = useWizardStore((s) => s.loadPlayers);
  const wizardAddPlayer = useWizardStore((s) => s.addPlayer);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [invite, setInvite] = useState<GameInvite | null>(null);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!inviteId) return;
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
        setInvite(data);
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

  // Matches RSVP'd guests to existing players by name (case-insensitive)
  // and creates a new player for anyone who doesn't have one yet, so the
  // wizard's player picker opens with the "in" guests already selected
  // instead of the host re-typing names they just collected.
  async function handleStartSession() {
    if (!invite) return;
    setIsStarting(true);
    try {
      await wizardLoadPlayers();
      const existingPlayers = useWizardStore.getState().players;
      const inGuests = invite.rsvps.filter((rsvp) => rsvp.status === "in");

      const playerIds: string[] = [];
      for (const guest of inGuests) {
        const match = existingPlayers.find(
          (player) => player.name.trim().toLowerCase() === guest.name.trim().toLowerCase(),
        );
        if (match) {
          playerIds.push(match.id);
        } else {
          const created = await wizardAddPlayer(guest.name);
          playerIds.push(created.id);
        }
      }

      wizardReset({
        name: invite.gameName,
        host: settings?.hostName || invite.hostName,
        location: invite.location,
        ...(invite.buyIn !== null ? { buyIn: invite.buyIn } : {}),
        playerIds,
      });
      wizardSetStep("players");
      wizardSetOpen(true);
      router.push("/sessions");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to sessions"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 truncate text-lg font-semibold text-foreground">
            {invite?.gameName ?? "Invite"}
          </span>
        </header>

        {loadState === "loading" && (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading invite...</p>
        )}

        {loadState === "not-found" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Spade className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Invite not found</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                This invite may have expired.
              </p>
            </CardContent>
          </Card>
        )}

        {loadState === "error" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="max-w-xs text-sm text-muted-foreground">
                Couldn&apos;t load this invite. Check your connection and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {loadState === "ready" && invite && (
          <>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Link expires</span>
                  <span className="font-medium text-foreground">
                    {formatExpiryLabel(invite.expiresAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => void handleCopy()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button className="flex-1" onClick={() => void handleShare()}>
                <Send className="h-4 w-4" />
                Share
              </Button>
            </div>

            {(() => {
              const summary = summarizeRsvps(invite);
              return (
                <Card>
                  <CardContent className="flex justify-around p-4 text-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-semibold text-success">{summary.inCount}</span>
                      <span className="text-xs text-muted-foreground">In</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-semibold text-foreground">
                        {summary.maybeCount}
                      </span>
                      <span className="text-xs text-muted-foreground">Maybe</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-semibold text-muted-foreground">
                        {summary.outCount}
                      </span>
                      <span className="text-xs text-muted-foreground">Out</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-foreground">Responses</span>
              {invite.rsvps.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    No responses yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2">
                  {invite.rsvps.map((rsvp) => (
                    <Card key={rsvp.guestToken}>
                      <CardContent className="flex items-center justify-between gap-3 p-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">{rsvp.name}</span>
                          {rsvp.eta && (
                            <span className="text-xs text-muted-foreground">ETA: {rsvp.eta}</span>
                          )}
                        </div>
                        <Badge variant={STATUS_BADGE[rsvp.status].variant}>
                          {STATUS_BADGE[rsvp.status].label}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={() => void handleStartSession()} disabled={isStarting}>
              <UserPlus className="h-4 w-4" />
              {isStarting ? "Starting..." : "Start Session with RSVPs"}
            </Button>
          </>
        )}
      </AnimatedPage>
    </PageContainer>
  );
}
