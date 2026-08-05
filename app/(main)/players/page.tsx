"use client";

import { Plus, Search, UserPlus } from "lucide-react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PlayersPage() {
  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Players"
          subtitle="Your poker regulars"
          action={
            <Button size="sm" aria-label="Add player">
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
          />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <UserPlus className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">No players yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add players to track stats, attendance, and lifetime profit.
            </p>
            <Button className="mt-2">
              <Plus className="h-4 w-4" />
              Add Player
            </Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    </PageContainer>
  );
}
