"use client";

import { ArrowRight, Plus, Spade, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { AnimatedPage } from "@/components/shared/animated-page";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
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
          <StatCard label="Sessions" value="0" icon={Spade} />
          <StatCard label="Players" value="0" icon={Users} />
          <StatCard label="Lifetime P/L" value="$0" icon={TrendingUp} />
          <StatCard label="This Month" value="0" icon={Spade} trend="No games yet" />
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
          </CardContent>
        </Card>
      </AnimatedPage>
    </PageContainer>
  );
}
