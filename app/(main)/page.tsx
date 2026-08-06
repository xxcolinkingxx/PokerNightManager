"use client";

import { ArrowRight, Plus, Spade, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { SessionStatus } from "@/lib/session/types";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";

const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: "Draft",
  active: "Live",
  paused: "Paused",
  completed: "Completed",
};

export default function DashboardPage() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const players = usePlayerStore((s) => s.players);
  const loadPlayers = usePlayerStore((s) => s.loadPlayers);

  useEffect(() => {
    void loadSessions();
    void loadPlayers();
  }, [loadSessions, loadPlayers]);

  const { totalBuyIns, sessionsThisMonth, recentSessions } = useMemo(() => {
    const now = new Date();
    const totalBuyIns = sessions.reduce(
      (sum, session) => sum + session.buyIn * session.playerIds.length,
      0,
    );
    const sessionsThisMonth = sessions.filter((session) => {
      const created = new Date(session.createdAt);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }).length;

    return {
      totalBuyIns,
      sessionsThisMonth,
      recentSessions: sessions.slice(0, 3),
    };
  }, [sessions]);

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Poker Night"
          subtitle="Your home game command center"
          action={
            <Badge variant="secondary">Offline Ready</Badge>
          }
        />

        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Ready to deal?</span>
              <span className="text-lg font-semibold">Start a new session</span>
            </div>
            <Button asChild size="icon" aria-label="Start new session">
              <Link href="/sessions">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sessions" value={String(sessions.length)} icon={Spade} />
          <StatCard label="Players" value={String(players.length)} icon={Users} />
          <StatCard
            label="Total Buy-Ins"
            value={formatCurrency(totalBuyIns)}
            icon={TrendingUp}
          />
          <StatCard
            label="This Month"
            value={String(sessionsThisMonth)}
            icon={Spade}
            trend={sessionsThisMonth > 0 ? "Active" : "No games yet"}
          />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sessions">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                  <Spade className="h-6 w-6 text-gold" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Start your first poker night.
                </p>
                <Button asChild className="mt-2">
                  <Link href="/sessions">New Session</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => router.push(`/sessions/${session.id}`)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {session.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABEL[session.status]}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedPage>
    </PageContainer>
  );
}
