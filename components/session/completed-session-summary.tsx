"use client";

import { ArrowLeft, ChevronRight, HandCoins, History, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildResultsCardData } from "@/lib/session/services/results-card-data";
import { renderResultsCardImage, shareOrDownloadImage } from "@/lib/session/services/results-card-image";
import { formatCurrency, getPlayerSummaries, ordinal } from "@/lib/session/services/session-engine";
import { computeSessionSettlement } from "@/lib/settlement/settlement-engine";
import { computeTournamentSummary } from "@/lib/tournament/tournament-engine";
import type { Session, SessionEvent } from "@/lib/session/types";

interface CompletedSessionSummaryProps {
  session: Session;
  events: SessionEvent[];
  onBack: () => void;
}

export function CompletedSessionSummary({
  session,
  events,
  onBack,
}: CompletedSessionSummaryProps) {
  const isTournament = session.type === "tournament";
  const players = getPlayerSummaries(events);
  const settlementPlan = computeSessionSettlement(events);
  const tournamentSummary = computeTournamentSummary(events);
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    setIsSharing(true);
    try {
      const data = buildResultsCardData(session, events);
      const blob = await renderResultsCardImage(data);
      await shareOrDownloadImage(blob, `${session.name} Results.png`, `${session.name} Results`);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to sessions"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-semibold text-foreground">{session.name}</span>
            <span className="text-xs text-muted-foreground">
              {session.host} · {session.location}
            </span>
          </div>
          <Badge variant="secondary">Completed</Badge>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <Trophy className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">Game Over</h2>
            <p className="text-sm text-muted-foreground">This session has ended.</p>
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => void handleShare()}
              disabled={isSharing}
            >
              <Share2 className="h-4 w-4" />
              {isSharing ? "Preparing..." : "Share Results"}
            </Button>
          </CardContent>
        </Card>

        <Link href={`/sessions/${session.id}/timeline`}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <History className="h-5 w-5 text-gold" aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Timeline</span>
                <span className="text-xs text-muted-foreground">Replay the whole night</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>

        {isTournament ? (
          <Link href={`/sessions/${session.id}/tournament`}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                  <Trophy className="h-5 w-5 text-gold" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Tournament Results</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(tournamentSummary.prizePool)} prize pool
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href={`/sessions/${session.id}/settle`}>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                  <HandCoins className="h-5 w-5 text-gold" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Settle Up</span>
                  <span className="text-xs text-muted-foreground">
                    {settlementPlan.transactions.length === 0
                      ? "Who pays who"
                      : `${settlementPlan.transactions.length} ${settlementPlan.transactions.length === 1 ? "payment" : "payments"} to settle`}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="flex flex-col gap-2">
          {isTournament
            ? tournamentSummary.standings.map((standing) => (
                <Card key={standing.playerId}>
                  <CardContent className="flex items-center justify-between p-3.5">
                    <span className="text-sm font-medium text-foreground">
                      {ordinal(standing.position)} · {standing.playerName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {standing.isPaid ? formatCurrency(standing.payout) : "—"}
                    </span>
                  </CardContent>
                </Card>
              ))
            : players.map((player) => (
                <Card key={player.playerId}>
                  <CardContent className="flex items-center justify-between p-3.5">
                    <span className="text-sm font-medium text-foreground">
                      {player.playerName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(player.total)}
                    </span>
                  </CardContent>
                </Card>
              ))}
        </div>
      </AnimatedPage>
    </PageContainer>
  );
}
