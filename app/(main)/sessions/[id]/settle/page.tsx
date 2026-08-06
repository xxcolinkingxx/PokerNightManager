"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, HandCoins, TriangleAlert } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/session/services/session-engine";
import { computeSessionSettlement } from "@/lib/settlement/settlement-engine";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

export default function SettleUpPage() {
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
  const plan = computeSessionSettlement(events);
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
            <span className="text-lg font-semibold text-foreground">Settle Up</span>
            <span className="text-xs text-muted-foreground">{session.name}</span>
          </div>
        </header>

        {plan.pendingPlayerNames.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
            <TriangleAlert className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <p className="text-sm text-foreground">
              {plan.pendingPlayerNames.join(", ")}{" "}
              {plan.pendingPlayerNames.length === 1 ? "hasn't" : "haven't"} cashed out yet.
              Record their cash-out to include them in settlement.
            </p>
          </div>
        )}

        {plan.nets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                <HandCoins className="h-7 w-7 text-gold" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">No cash-outs yet</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Once players cash out, this shows exactly who pays who.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {plan.nets.map((net) => (
                  <div key={net.playerId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar
                        name={net.playerName}
                        avatar={avatarById.get(net.playerId)}
                        className="h-6 w-6 text-[0.6rem]"
                      />
                      <span className="text-foreground">{net.playerName}</span>
                    </div>
                    <span
                      className={cn(
                        "font-semibold",
                        net.amount >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {net.amount > 0 ? "+" : ""}
                      {formatCurrency(net.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-foreground">
                {plan.transactions.length === 0
                  ? "Nobody owes anybody"
                  : `${plan.transactions.length} ${plan.transactions.length === 1 ? "payment" : "payments"} to settle up`}
              </span>

              {plan.transactions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">Everyone&apos;s already even.</p>
                  </CardContent>
                </Card>
              ) : (
                plan.transactions.map((tx) => (
                  <Card key={`${tx.fromPlayerId}-${tx.toPlayerId}`}>
                    <CardContent className="flex flex-col items-center gap-3 p-4">
                      <div className="flex w-full items-center gap-3">
                        <div className="flex flex-1 items-center gap-2 overflow-hidden">
                          <PlayerAvatar
                            name={tx.fromPlayerName}
                            avatar={avatarById.get(tx.fromPlayerId)}
                          />
                          <span className="truncate text-sm font-medium text-foreground">
                            {tx.fromPlayerName}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                        <div className="flex flex-1 items-center justify-end gap-2 overflow-hidden">
                          <span className="truncate text-sm font-medium text-foreground">
                            {tx.toPlayerName}
                          </span>
                          <PlayerAvatar
                            name={tx.toPlayerName}
                            avatar={avatarById.get(tx.toPlayerId)}
                          />
                        </div>
                      </div>
                      <span className="text-2xl font-semibold text-gold">
                        {formatCurrency(tx.amount)}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </AnimatedPage>
    </PageContainer>
  );
}
