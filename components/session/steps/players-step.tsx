"use client";

import { Check, Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playersStepSchema } from "@/lib/session/schemas";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

export function PlayersStep() {
  const players = useWizardStore((s) => s.players);
  const selectedIds = useWizardStore((s) => s.data.playerIds);
  const loadPlayers = useWizardStore((s) => s.loadPlayers);
  const addPlayer = useWizardStore((s) => s.addPlayer);
  const togglePlayer = useWizardStore((s) => s.togglePlayer);
  const setStep = useWizardStore((s) => s.setStep);

  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  async function handleAddPlayer() {
    const name = newName.trim();
    if (!name) return;
    setIsAdding(true);
    const player = await addPlayer(name);
    togglePlayer(player.id);
    setNewName("");
    setIsAdding(false);
  }

  function handleContinue() {
    const result = playersStepSchema.safeParse({ playerIds: selectedIds });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Select at least 2 players");
      return;
    }
    setError(null);
    setStep("summary");
  }

  return (
    <div className="flex flex-col gap-5">
      <WizardStepHeader title="Players" subtitle="Who's at the table tonight?" />

      <div className="flex gap-2">
        <Input
          placeholder="Add a player"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAddPlayer();
            }
          }}
          aria-label="New player name"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void handleAddPlayer()}
          disabled={isAdding || !newName.trim()}
          aria-label="Add player"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {players.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6 text-center">
            <UserPlus className="h-6 w-6 text-gold" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              No players yet. Add your first one above.
            </p>
          </div>
        ) : (
          players.map((player) => {
            const isSelected = selectedIds.includes(player.id);
            return (
              <button
                type="button"
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                  isSelected ? "border-gold bg-gold/5" : "border-border bg-card",
                )}
              >
                <PlayerAvatar
                  name={player.nickname || player.name}
                  avatar={player.avatar}
                />
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

      {error && <p className="text-xs text-danger">{error}</p>}
      <p className="text-xs text-muted-foreground">{selectedIds.length} selected</p>

      <WizardStepFooter
        onBack={() => setStep("blinds")}
        onContinue={handleContinue}
        submitLabel="Continue"
      />
    </div>
  );
}
