"use client";

import { Swords } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeadToHeadStats } from "@/lib/players/head-to-head";
import { getHeadToHeadStats } from "@/lib/players/services/head-to-head-service";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { Player } from "@/lib/session/types";
import { cn } from "@/lib/utils";

interface HeadToHeadCardProps {
  currentPlayerId: string;
  currentPlayerName: string;
  otherPlayers: Player[];
}

function profitLabel(amount: number) {
  return `${amount > 0 ? "+" : ""}${formatCurrency(amount)}`;
}

export function HeadToHeadCard({ currentPlayerId, currentPlayerName, otherPlayers }: HeadToHeadCardProps) {
  const [opponentId, setOpponentId] = useState("");

  // Re-anchor the result to null the instant a different opponent is
  // picked (render-time, not a synchronous setState in the effect body
  // below), so switching opponents never briefly shows the previous
  // matchup's record while the new one loads.
  const [snapshot, setSnapshot] = useState<{ opponentId: string; stats: HeadToHeadStats | null }>({
    opponentId: "",
    stats: null,
  });
  if (snapshot.opponentId !== opponentId) {
    setSnapshot({ opponentId, stats: null });
  }

  useEffect(() => {
    if (!opponentId) return;
    let cancelled = false;
    getHeadToHeadStats(currentPlayerId, opponentId).then((result) => {
      if (!cancelled) setSnapshot({ opponentId, stats: result });
    });
    return () => {
      cancelled = true;
    };
  }, [currentPlayerId, opponentId]);

  const stats = snapshot.opponentId === opponentId ? snapshot.stats : null;
  const isLoading = opponentId !== "" && stats === null;

  if (otherPlayers.length === 0) return null;

  const opponent = otherPlayers.find((p) => p.id === opponentId);
  const opponentName = opponent?.nickname || opponent?.name || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Swords className="h-4 w-4 text-gold" aria-hidden="true" />
          Head to Head
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={opponentId} onValueChange={setOpponentId}>
          <SelectTrigger>
            <SelectValue placeholder="Compare against..." />
          </SelectTrigger>
          <SelectContent>
            {otherPlayers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nickname || p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!isLoading && stats && stats.meetingsCount === 0 && (
          <p className="text-sm text-muted-foreground">
            No completed sessions with {opponentName} yet.
          </p>
        )}

        {!isLoading && stats && stats.meetingsCount > 0 && (
          <>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-semibold text-foreground">{stats.playerAWins}</span>
                <span className="max-w-[6rem] truncate text-xs text-muted-foreground">
                  {currentPlayerName}
                </span>
              </div>
              <span className="text-center text-xs text-muted-foreground">
                {stats.meetingsCount} {stats.meetingsCount === 1 ? "session" : "sessions"}
                {stats.ties > 0 ? (
                  <>
                    <br />
                    {stats.ties} tie{stats.ties === 1 ? "" : "s"}
                  </>
                ) : null}
              </span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-semibold text-foreground">{stats.playerBWins}</span>
                <span className="max-w-[6rem] truncate text-xs text-muted-foreground">{opponentName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5 rounded-xl border border-border p-3">
                <span className="truncate text-xs text-muted-foreground">{currentPlayerName}&apos;s P/L</span>
                <span
                  className={cn(
                    "font-semibold",
                    stats.playerATotalProfit >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {profitLabel(stats.playerATotalProfit)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-xl border border-border p-3">
                <span className="truncate text-xs text-muted-foreground">{opponentName}&apos;s P/L</span>
                <span
                  className={cn(
                    "font-semibold",
                    stats.playerBTotalProfit >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {profitLabel(stats.playerBTotalProfit)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
