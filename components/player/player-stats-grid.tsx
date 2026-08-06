import { Calendar, DollarSign, TrendingUp, Trophy } from "lucide-react";

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
      <StatCard label="Lifetime P/L" value="—" icon={TrendingUp} trend="Tracks after cash-outs" />
      <StatCard label="ROI" value="—" icon={TrendingUp} trend="Tracks after cash-outs" />
    </div>
  );
}
