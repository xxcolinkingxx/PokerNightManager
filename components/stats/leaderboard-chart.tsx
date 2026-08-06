"use client";

import { motion } from "framer-motion";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { animation } from "@/lib/theme/tokens";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { LeaderboardEntry } from "@/lib/stats/global-stats-engine";
import type { Player } from "@/lib/session/types";
import { cn } from "@/lib/utils";

interface LeaderboardChartProps {
  entries: LeaderboardEntry[];
  playerRecords: Player[];
}

export function LeaderboardChart({ entries, playerRecords }: LeaderboardChartProps) {
  const avatarById = new Map(playerRecords.map((p) => [p.id, p.avatar]));
  const maxAbsProfit = Math.max(1, ...entries.map((entry) => Math.abs(entry.profit)));

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => {
        const widthPct = (Math.abs(entry.profit) / maxAbsProfit) * 100;
        const isPositive = entry.profit >= 0;

        return (
          <div key={entry.playerId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  name={entry.playerName}
                  avatar={avatarById.get(entry.playerId)}
                  className="h-6 w-6 text-[0.6rem]"
                />
                <span className="text-sm font-medium text-foreground">{entry.playerName}</span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  isPositive ? "text-success" : "text-danger",
                )}
              >
                {isPositive ? "+" : ""}
                {formatCurrency(entry.profit)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={animation.ease}
                className={cn("h-full rounded-full", isPositive ? "bg-success" : "bg-danger")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
