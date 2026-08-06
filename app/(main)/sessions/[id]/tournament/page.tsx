"use client";

import { ArrowLeft, Medal, Trophy, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, ordinal } from "@/lib/session/services/session-engine";
import { computeTournamentSummary } from "@/lib/tournament/tournament-engine";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

export default function TournamentResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const liveState = useSessionStore((s) => s.liveState);
  const loadLiveState = useSessionStore((s) => s.loadLiveState);
  const playerRecords = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);

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

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

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
            Loading...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const { session, events } = liveState;
  const summary = computeTournamentSummary(events);
  const avatarById = new Map(playerRecords.map((p) => [p.id, p.avatar]));

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
            <span className="text-lg font-semibold text-foreground">Tournament Results</span>
            <span className="text-xs text-muted-foreground">{session.name}</span>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prize Pool</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1 py-2">
              <span className="text-3xl font-semibold text-gold">
                {formatCurrency(summary.prizePool)}
              </span>
              <span className="text-xs text-muted-foreground">
                {summary.entrantCount} {summary.entrantCount === 1 ? "entrant" : "entrants"}
              </span>
            </div>

            {summary.payoutStructure.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                {summary.payoutStructure.map((slot) => (
                  <div key={slot.position} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {ordinal(slot.position)} place · {slot.percentage}%
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(slot.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {summary.remainingCount > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
            <Users className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <p className="text-sm text-foreground">
              Still playing: {summary.activePlayerNames.join(", ")}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Standings</span>

          {summary.standings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                  <Trophy className="h-7 w-7 text-gold" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold">No eliminations yet</h2>
                <p className="max-w-xs text-sm text-muted-foreground">
                  As players bust out, their finishing place and payout show up here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {summary.standings.map((standing) => (
                <Card key={standing.playerId}>
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        standing.position === 1
                          ? "bg-gold text-background"
                          : "bg-white/5 text-muted-foreground",
                      )}
                    >
                      {standing.position <= 3 ? (
                        <Medal className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        standing.position
                      )}
                    </div>
                    <PlayerAvatar
                      name={standing.playerName}
                      avatar={avatarById.get(standing.playerId)}
                      className="h-8 w-8 text-xs"
                    />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {standing.playerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ordinal(standing.position)} place
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        standing.isPaid ? "text-gold" : "text-muted-foreground",
                      )}
                    >
                      {standing.isPaid ? formatCurrency(standing.payout) : "—"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AnimatedPage>
    </PageContainer>
  );
}
