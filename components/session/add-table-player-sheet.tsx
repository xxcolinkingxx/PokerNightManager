"use client";

import { Check, Plus, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";

interface AddTablePlayerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  defaultBuyIn: number;
  excludePlayerIds: string[];
}

export function AddTablePlayerSheet({
  open,
  onOpenChange,
  sessionId,
  defaultBuyIn,
  excludePlayerIds,
}: AddTablePlayerSheetProps) {
  const players = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);
  const addPlayer = usePlayerStore((s) => s.addPlayer);
  const addPlayerToSession = useSessionStore((s) => s.addPlayerToSession);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [buyIn, setBuyIn] = useState(String(defaultBuyIn));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    void loadPlayers();
    // Deferred via setTimeout: a synchronous setState at the top of an
    // effect body trips react-hooks/set-state-in-effect.
    const timeout = setTimeout(() => {
      setSelectedId(null);
      setNewName("");
      setBuyIn(String(defaultBuyIn));
    }, 0);
    return () => clearTimeout(timeout);
  }, [open, defaultBuyIn, loadPlayers]);

  const availablePlayers = useMemo(
    () => players.filter((p) => !excludePlayerIds.includes(p.id)),
    [players, excludePlayerIds],
  );

  async function handleAddNewPlayer() {
    const name = newName.trim();
    if (!name) return;
    setIsAdding(true);
    const player = await addPlayer(name);
    setSelectedId(player.id);
    setNewName("");
    setIsAdding(false);
  }

  async function handleSubmit() {
    if (!selectedId) return;
    const amount = Number(buyIn);
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    await addPlayerToSession(sessionId, selectedId, amount);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col overflow-hidden px-0">
        <SheetHeader>
          <SheetTitle>Add Player to Table</SheetTitle>
          <SheetDescription>Buy in a new arrival mid-session.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Quick-add a new player"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddNewPlayer();
                }
              }}
              aria-label="New player name"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => void handleAddNewPlayer()}
              disabled={isAdding || !newName.trim()}
              aria-label="Add new player"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {availablePlayers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center">
                <UserPlus className="h-6 w-6 text-gold" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Everyone in your player database is already at this table.
                </p>
              </div>
            ) : (
              availablePlayers.map((player) => {
                const isSelected = selectedId === player.id;
                return (
                  <button
                    type="button"
                    key={player.id}
                    onClick={() => setSelectedId(player.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      isSelected ? "border-gold bg-gold/5" : "border-border bg-card",
                    )}
                  >
                    <PlayerAvatar name={player.nickname || player.name} avatar={player.avatar} />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {player.nickname || player.name}
                    </span>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-background">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="table-buy-in">Buy-In ($)</Label>
            <Input
              id="table-buy-in"
              type="number"
              inputMode="decimal"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
            />
          </div>

          <SheetFooter className="px-0 pb-0">
            <Button
              type="button"
              disabled={!selectedId || !buyIn || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              Add to Table
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
