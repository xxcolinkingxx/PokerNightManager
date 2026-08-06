import { Calendar, DollarSign, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import type { PlayerStats } from "@/lib/players/player-stats";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { SessionType } from "@/lib/session/types";

const GAME_TYPE_LABEL: Record<SessionType, string> = {
  cash: "Cash Game",
  tournament: "Tournament",
};

interface PlayerStatsGridProps {
  stats: PlayerStats;
}

export function PlayerStatsGrid({ stats }: PlayerStatsGridProps) {
  const hasCompletedGames = stats.completedSessionsCount > 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Sessions Played" value={String(stats.sessionsPlayed)} icon={Calendar} />
      <StatCard
        label="Favorite Game"
        value={stats.favoriteGameType ? GAME_TYPE_LABEL[stats.favoriteGameType] : "—"}
        icon={Trophy}
      />
      <StatCard label="Total Buy-In" value={formatCurrency(stats.totalBuyIn)} icon={DollarSign} />
      <StatCard label="Avg Buy-In" value={formatCurrency(stats.averageBuyIn)} icon={DollarSign} />
      <StatCard
        label="Lifetime P/L"
        value={
          hasCompletedGames
            ? `${stats.profit > 0 ? "+" : ""}${formatCurrency(stats.profit)}`
            : "—"
        }
        icon={TrendingUp}
        trend={hasCompletedGames ? undefined : "No completed games yet"}
      />
      <StatCard
        label="ROI"
        value={stats.roi !== null ? `${stats.roi > 0 ? "+" : ""}${(stats.roi * 100).toFixed(0)}%` : "—"}
        icon={TrendingUp}
        trend={stats.roi === null ? "No completed games yet" : undefined}
      />
      <StatCard
        label="Largest Win"
        value={
          stats.largestWin !== null && stats.largestWin > 0
            ? formatCurrency(stats.largestWin)
            : "—"
        }
        icon={TrendingUp}
      />
      <StatCard
        label="Largest Loss"
        value={
          stats.largestLoss !== null && stats.largestLoss < 0
            ? `-${formatCurrency(Math.abs(stats.largestLoss))}`
            : "—"
        }
        icon={TrendingDown}
      />
    </div>
  );
}
