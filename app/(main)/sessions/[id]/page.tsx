"use client";

import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  Coins,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AddTablePlayerSheet } from "@/components/session/add-table-player-sheet";
import { CompletedSessionSummary } from "@/components/session/completed-session-summary";
import { PlayerQuickActionsSheet } from "@/components/session/player-quick-actions-sheet";
import { PokerTable } from "@/components/session/poker-table";
import { AnimatedPage } from "@/components/shared/animated-page";
import { GlassCard } from "@/components/shared/glass-card";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { computeBankerSummary } from "@/lib/banker/banker-engine";
import { BLIND_STRUCTURES } from "@/lib/session/constants";
import {
  formatCurrency,
  getCurrentDealer,
  getPlayerSummaries,
} from "@/lib/session/services/session-engine";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";

export default function LiveSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const liveState = useSessionStore((s) => s.liveState);
  const loadLiveState = useSessionStore((s) => s.loadLiveState);
  const updatePot = useSessionStore((s) => s.updatePot);
  const toggleBreak = useSessionStore((s) => s.toggleBreak);
  const increaseBlind = useSessionStore((s) => s.increaseBlind);
  const endSession = useSessionStore((s) => s.endSession);

  const playerRecords = usePlayerStore((s) => s.players);
  const loadPlayerRecords = usePlayerStore((s) => s.loadPlayers);

  const [potInput, setPotInput] = useState("");
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

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
    void loadPlayerRecords();
  }, [loadPlayerRecords]);

  const timerDisplay = useSessionTimer(liveState);

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
            Loading session...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const { session, events, isOnBreak, currentPot, currentBlindLevel } = liveState;

  if (session.status === "completed") {
    return (
      <CompletedSessionSummary
        session={session}
        events={events}
        onBack={() => router.push("/sessions")}
      />
    );
  }

  const structure = BLIND_STRUCTURES.find((s) => s.id === session.blindStructureId);
  const blindLevel = structure?.levels.find((l) => l.level === currentBlindLevel);
  const nextBlindLevel = structure?.levels.find((l) => l.level === currentBlindLevel + 1);
  const players = getPlayerSummaries(events);
  const dealerPlayerId = getCurrentDealer(events);
  const cashedOutPlayers = players.filter((p) => p.isCashedOut);
  const bankerSummary = computeBankerSummary(events);

  const selectedSummary = players.find((p) => p.playerId === selectedPlayerId) ?? null;
  const selectedPlayerRecord =
    playerRecords.find((p) => p.id === selectedPlayerId) ?? null;

  async function handleAddToPot() {
    const amount = Number(potInput);
    if (!amount || amount <= 0) return;
    await updatePot(sessionId, "add", amount);
    setPotInput("");
  }

  async function handleEndGame() {
    setIsEnding(true);
    await endSession(sessionId);
    router.push("/sessions");
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to sessions"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 flex-col items-center gap-0.5 text-center">
            <span className="text-base font-semibold text-foreground">{session.name}</span>
            <span className="text-xs text-muted-foreground">
              {session.host} · {session.location}
            </span>
          </div>
          <Badge variant={isOnBreak ? "secondary" : "success"}>
            {isOnBreak ? "On Break" : "Live"}
          </Badge>
        </header>

        <GlassCard className="flex flex-col items-center gap-2 p-6">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Elapsed</span>
          <span className="text-4xl font-semibold tabular-nums text-foreground">
            {timerDisplay}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void toggleBreak(sessionId)}
            className="mt-1"
          >
            {isOnBreak ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
            {isOnBreak ? "Resume Game" : "Start Break"}
          </Button>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Pot
              </span>
              <span className="text-2xl font-semibold text-foreground">
                {formatCurrency(currentPot)}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Blinds
              </span>
              <span className="text-2xl font-semibold text-foreground">
                {blindLevel ? `${blindLevel.smallBlind}/${blindLevel.bigBlind}` : "—"}
              </span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <span className="text-sm font-semibold text-foreground">Pot Tracking</span>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={potInput}
                onChange={(e) => setPotInput(e.target.value)}
                aria-label="Add to pot amount"
              />
              <Button type="button" onClick={() => void handleAddToPot()} disabled={!potInput}>
                Add
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void updatePot(sessionId, "clear")}
              disabled={currentPot === 0}
            >
              Clear Pot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Blind Level</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void increaseBlind(sessionId)}
                disabled={!nextBlindLevel}
              >
                Next Level
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextBlindLevel
                ? `Next: ${nextBlindLevel.smallBlind}/${nextBlindLevel.bigBlind}`
                : "Final level reached"}
            </p>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => router.push(`/sessions/${sessionId}/banker`)}
          className="w-full text-left"
        >
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <Banknote className="h-5 w-5 text-gold" aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Banker</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(bankerSummary.expectedCash)} expected cash
                  {bankerSummary.outstanding.length > 0 &&
                    ` · ${bankerSummary.outstanding.length} outstanding`}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">Table</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAddPlayerOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
          </div>

          <PokerTable
            players={players}
            dealerPlayerId={dealerPlayerId}
            playerRecords={playerRecords}
            onSelectSeat={setSelectedPlayerId}
          />

          {cashedOutPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cashedOutPlayers.map((player) => (
                <button
                  type="button"
                  key={player.playerId}
                  onClick={() => setSelectedPlayerId(player.playerId)}
                >
                  <Badge variant="secondary">{player.playerName} · Cashed Out</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="destructive" onClick={() => setConfirmEndOpen(true)}>
          End Game
        </Button>
      </AnimatedPage>

      <Sheet open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>End this session?</SheetTitle>
            <SheetDescription>
              This closes the game for everyone. You can&apos;t add more buy-ins or rebuys
              after this.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setConfirmEndOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isEnding} onClick={() => void handleEndGame()}>
              {isEnding ? "Ending..." : "End Game"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {selectedSummary && selectedPlayerRecord && (
        <PlayerQuickActionsSheet
          open={selectedPlayerId !== null}
          onOpenChange={(open) => !open && setSelectedPlayerId(null)}
          sessionId={sessionId}
          player={selectedPlayerRecord}
          summary={selectedSummary}
          isDealer={selectedPlayerId === dealerPlayerId}
          events={events}
        />
      )}

      <AddTablePlayerSheet
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        sessionId={sessionId}
        defaultBuyIn={session.buyIn}
        excludePlayerIds={players.map((p) => p.playerId)}
      />
    </PageContainer>
  );
}
