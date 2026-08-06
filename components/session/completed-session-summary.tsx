import { ArrowLeft, Trophy } from "lucide-react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getPlayerSummaries } from "@/lib/session/services/session-engine";
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
  const players = getPlayerSummaries(events);

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
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <Card key={player.playerId}>
              <CardContent className="flex items-center justify-between p-3.5">
                <span className="text-sm font-medium text-foreground">{player.playerName}</span>
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
