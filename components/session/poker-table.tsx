"use client";

import { PlayerAvatar } from "@/components/player/player-avatar";
import {
  formatCurrency,
  type PlayerSessionSummary,
} from "@/lib/session/services/session-engine";
import type { Player } from "@/lib/session/types";

interface PokerTableProps {
  players: PlayerSessionSummary[];
  dealerPlayerId: string | null;
  playerRecords: Player[];
  onSelectSeat: (playerId: string) => void;
}

export function PokerTable({
  players,
  dealerPlayerId,
  playerRecords,
  onSelectSeat,
}: PokerTableProps) {
  const activePlayers = players.filter((p) => !p.isCashedOut && !p.isEliminated);

  if (activePlayers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No active players remaining.</p>
      </div>
    );
  }

  const avatarById = new Map(playerRecords.map((p) => [p.id, p.avatar]));
  const count = activePlayers.length;
  const radius = 40;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
      <div className="absolute inset-[14%] rounded-full border-4 border-gold/15 bg-gradient-to-br from-card to-background shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]" />
      {activePlayers.map((player, index) => {
        const angle = (2 * Math.PI * index) / count - Math.PI / 2;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        const isDealer = player.playerId === dealerPlayerId;

        return (
          <button
            key={player.playerId}
            type="button"
            onClick={() => onSelectSeat(player.playerId)}
            style={{ left: `${left}%`, top: `${top}%` }}
            className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            aria-label={`${player.playerName}, seat ${player.seat}`}
          >
            <div className="relative">
              <PlayerAvatar
                name={player.playerName}
                avatar={avatarById.get(player.playerId)}
                className="h-12 w-12 border-2 border-border"
              />
              {isDealer && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-gold text-[0.6rem] font-bold text-background">
                  D
                </span>
              )}
            </div>
            <span className="w-full truncate text-center text-[0.7rem] font-medium text-foreground">
              {player.playerName}
            </span>
            <span className="text-[0.65rem] font-semibold text-gold">
              {formatCurrency(player.total)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
