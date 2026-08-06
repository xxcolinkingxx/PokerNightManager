"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EditPlayerSheet } from "@/components/player/edit-player-sheet";
import { HeadToHeadCard } from "@/components/player/head-to-head-card";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { PlayerContactCard } from "@/components/player/player-contact-card";
import { PlayerHistoryList } from "@/components/player/player-history-list";
import { PlayerStatsGrid } from "@/components/player/player-stats-grid";
import { YearlyAttendanceChart } from "@/components/player/yearly-attendance-chart";
import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PlayerStats } from "@/lib/players/player-stats";
import { getPlayerStats } from "@/lib/players/services/player-stats-service";
import { usePlayerStore } from "@/stores/player-store";

export default function PlayerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const players = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);
  const removePlayer = usePlayerStore((s) => s.removePlayer);

  const [playersReady, setPlayersReady] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPlayers().then(() => {
      if (!cancelled) setPlayersReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPlayers]);

  useEffect(() => {
    let cancelled = false;
    getPlayerStats(params.id).then((result) => {
      if (!cancelled) setStats(result);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleDelete() {
    setIsDeleting(true);
    await removePlayer(params.id);
    router.push("/players");
  }

  if (!playersReady) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading player...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const player = players.find((p) => p.id === params.id);

  if (!player) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Player not found</h2>
              <Button onClick={() => router.push("/players")}>Back to Players</Button>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/players")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to players"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <PlayerAvatar
              name={player.nickname || player.name}
              avatar={player.avatar}
              className="h-12 w-12 shrink-0"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-semibold text-foreground">
                {player.nickname || player.name}
              </span>
              {player.nickname && player.nickname !== player.name && (
                <span className="truncate text-xs text-muted-foreground">{player.name}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Edit player"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Remove player"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </header>

        {stats && <PlayerStatsGrid stats={stats} />}

        {stats && stats.attendanceByYear.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance by Year</CardTitle>
            </CardHeader>
            <CardContent>
              <YearlyAttendanceChart data={stats.attendanceByYear} />
            </CardContent>
          </Card>
        )}

        <HeadToHeadCard
          currentPlayerId={player.id}
          currentPlayerName={player.nickname || player.name}
          otherPlayers={players.filter((p) => p.id !== player.id)}
        />

        <PlayerContactCard player={player} />

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Session History</span>
          {stats && <PlayerHistoryList history={stats.history} />}
        </div>
      </AnimatedPage>

      <EditPlayerSheet player={player} open={editOpen} onOpenChange={setEditOpen} />

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Remove {player.name}?</SheetTitle>
            <SheetDescription>
              This removes them from your player database. Past session history is unaffected.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
