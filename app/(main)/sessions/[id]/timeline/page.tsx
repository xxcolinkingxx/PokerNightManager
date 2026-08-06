"use client";

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Coffee,
  Coins,
  Crown,
  DollarSign,
  Flag,
  type LucideIcon,
  LogOut,
  Play,
  RefreshCw,
  TrendingUp,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeElapsedMs,
  computePot,
  formatCurrency,
  formatElapsedTime,
  getCurrentBlindLevel,
  getPlayerSummaries,
} from "@/lib/session/services/session-engine";
import { buildTimeline } from "@/lib/session/services/timeline-engine";
import type { SessionEventType } from "@/lib/session/types";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

const EVENT_ICON: Record<SessionEventType, LucideIcon> = {
  session_started: Play,
  player_joined: UserPlus,
  buy_in: DollarSign,
  rebuy: RefreshCw,
  cash_out: LogOut,
  dealer_changed: Crown,
  blind_increased: TrendingUp,
  player_left: UserMinus,
  break_started: Coffee,
  break_ended: Play,
  pot_updated: Coins,
  game_ended: Flag,
  payment_settled: CheckCircle2,
  cash_recounted: Banknote,
};

export default function TimelinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const liveState = useSessionStore((s) => s.liveState);
  const loadLiveState = useSessionStore((s) => s.loadLiveState);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLiveState(sessionId).catch(() => {
      if (!cancelled) setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, loadLiveState]);

  if (notFound) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Session not found</h2>
              <Button onClick={() => router.push("/sessions")}>Back to Sessions</Button>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  if (!liveState) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading timeline...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const { session, events } = liveState;
  const timeline = buildTimeline(events);

  if (events.length === 0) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Nothing to replay yet</h2>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const lastIndex = events.length - 1;
  const clampedIndex = Math.max(0, Math.min(selectedIndex ?? lastIndex, lastIndex));
  const isReplaying = clampedIndex < lastIndex;

  const snapshotEvents = events.slice(0, clampedIndex + 1);
  const snapshotEvent = events[clampedIndex];
  const snapshotTime = new Date(snapshotEvent.timestamp);
  const elapsedMs = computeElapsedMs(snapshotEvents, snapshotTime);
  const pot = computePot(snapshotEvents);
  const blindLevel = getCurrentBlindLevel(snapshotEvents, session.blindStructureId);
  const playerSummaries = getPlayerSummaries(snapshotEvents);

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to session"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">Timeline</span>
            <span className="text-xs text-muted-foreground">{session.name}</span>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Snapshot</span>
              <span className="text-xs font-normal text-muted-foreground">
                {isReplaying ? "Replaying" : "Latest"} ·{" "}
                {snapshotTime.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Elapsed</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatElapsedTime(elapsedMs)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Pot</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(pot)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Blinds</span>
                <span className="text-sm font-semibold text-foreground">
                  {blindLevel.smallBlind}/{blindLevel.bigBlind}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {playerSummaries.map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    className={cn(
                      "text-foreground",
                      player.isCashedOut && "text-muted-foreground line-through",
                    )}
                  >
                    {player.playerName}
                  </span>
                  <span className="text-muted-foreground">{formatCurrency(player.total)}</span>
                </div>
              ))}
            </div>

            <input
              type="range"
              min={0}
              max={lastIndex}
              step={1}
              value={clampedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full accent-gold"
              aria-label="Replay scrubber"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {timeline.map((entry, index) => {
            const Icon = EVENT_ICON[entry.type];
            const isSelected = index === clampedIndex;
            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  isSelected ? "border-gold bg-gold/5" : "border-border bg-card",
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10">
                  <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                </div>
                <span className="flex-1 text-sm text-foreground">{entry.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </AnimatedPage>
    </PageContainer>
  );
}
