"use client";

import { BarChart3, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { StatCard } from "@/components/shared/stat-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsPage() {
  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Statistics"
          subtitle="Track performance over time"
        />

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Win Rate" value="—" icon={Trophy} />
          <StatCard label="ROI" value="—" icon={TrendingUp} />
          <StatCard label="Total Won" value="$0" icon={TrendingUp} />
          <StatCard label="Total Lost" value="$0" icon={TrendingDown} />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <BarChart3 className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">No data yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Complete your first session to unlock charts and leaderboards.
            </p>
          </CardContent>
        </Card>
      </AnimatedPage>
    </PageContainer>
  );
}
