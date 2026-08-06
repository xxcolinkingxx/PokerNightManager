"use client";

import { Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AddPlayerSheet } from "@/components/player/add-player-sheet";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { AnimatedPage } from "@/components/shared/animated-page";
import { StaggerItem, StaggerList } from "@/components/shared/stagger-list";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
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
import type { Player } from "@/lib/session/types";
import { usePlayerStore } from "@/stores/player-store";

export default function PlayersPage() {
  const router = useRouter();
  const players = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);
  const removePlayer = usePlayerStore((s) => s.removePlayer);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) => p.name.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q),
    );
  }, [players, query]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await removePlayer(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Players"
          subtitle="Your poker regulars"
          action={
            <Button size="sm" aria-label="Add player" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          }
        />

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search players..."
            className="pl-11"
            aria-label="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {players.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                <UserPlus className="h-7 w-7 text-gold" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">No players yet</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Add players to track stats, attendance, and lifetime profit.
              </p>
              <Button className="mt-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
            </CardContent>
          </Card>
        ) : filteredPlayers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No players match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <StaggerList>
            {filteredPlayers.map((player) => (
              <StaggerItem
                key={player.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/players/${player.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/players/${player.id}`);
                  }
                }}
                className="cursor-pointer"
              >
                <Card>
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <PlayerAvatar name={player.nickname || player.name} avatar={player.avatar} />
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {player.nickname || player.name}
                      </span>
                      {player.nickname && player.nickname !== player.name && (
                        <span className="text-xs text-muted-foreground">{player.name}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(player);
                      }}
                      aria-label={`Remove ${player.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </AnimatedPage>

      <AddPlayerSheet open={addOpen} onOpenChange={setAddOpen} />

      <Sheet open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Remove {deleteTarget?.name}?</SheetTitle>
            <SheetDescription>
              This removes them from your player database. Past session history is unaffected.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
