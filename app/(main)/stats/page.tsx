"use client";

import { BarChart3, Coins, DollarSign, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { LeaderboardChart } from "@/components/stats/leaderboard-chart";
import { AnimatedPage } from "@/components/shared/animated-page";
import { StatCard } from "@/components/shared/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/session/services/session-engine";
import { getAllSessionsWithEvents } from "@/lib/session/services/session-history-service";
import type { SessionWithEvents } from "@/lib/session/types";
import { computeGlobalStats, type StatsWindow } from "@/lib/stats/global-stats-engine";
import { usePlayerStore } from "@/stores/player-store";

const WINDOWS: Array<{ value: StatsWindow; label: string }> = [
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

type LeaderboardMode = "profit" | "attendance";

const LEADERBOARD_MODES: Array<{ value: LeaderboardMode; label: string }> = [
  { value: "profit", label: "Profit" },
  { value: "attendance", label: "Attendance" },
];

export default function StatsPage() {
  const playerRecords = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);

  const [data, setData] = useState<SessionWithEvents[] | null>(null);
  const [statsWindow, setStatsWindow] = useState<StatsWindow>("all");
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("profit");

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    let cancelled = false;
    getAllSessionsWithEvents().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading statistics...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const stats = computeGlobalStats(data, statsWindow);

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader title="Statistics" subtitle="Track performance over time" />

        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <Button
              key={w.value}
              type="button"
              size="sm"
              variant={statsWindow === w.value ? "default" : "secondary"}
              onClick={() => setStatsWindow(w.value)}
            >
              {w.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sessions" value={String(stats.sessionsCount)} icon={BarChart3} />
          <StatCard
            label="Biggest Pot"
            value={formatCurrency(stats.biggestPot)}
            icon={Trophy}
            trend={stats.biggestPotSessionName ?? undefined}
          />
          <StatCard
            label="Buy-Ins"
            value={formatCurrency(stats.totalBuyInVolume)}
            icon={DollarSign}
          />
          <StatCard label="Rebuys" value={formatCurrency(stats.totalRebuyVolume)} icon={Coins} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leaderboard</CardTitle>
            <div className="flex gap-2 pt-1">
              {LEADERBOARD_MODES.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  size="sm"
                  variant={leaderboardMode === m.value ? "default" : "secondary"}
                  onClick={() => setLeaderboardMode(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {stats.leaderboard.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                  <BarChart3 className="h-7 w-7 text-gold" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">No data yet</h2>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Complete a session in this time range to see the leaderboard.
                </p>
              </div>
            ) : (
              <LeaderboardChart
                entries={
                  leaderboardMode === "profit" ? stats.leaderboard : stats.attendanceLeaderboard
                }
                playerRecords={playerRecords}
                mode={leaderboardMode}
              />
            )}
          </CardContent>
        </Card>
      </AnimatedPage>
    </PageContainer>
  );
}
