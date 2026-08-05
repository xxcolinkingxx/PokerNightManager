"use client";

import { Calendar, Clock, Plus, Spade } from "lucide-react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SessionsPage() {
  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Sessions"
          subtitle="Manage your poker nights"
          action={
            <Button size="sm" aria-label="Create new session">
              <Plus className="h-4 w-4" />
              New
            </Button>
          }
        />

        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <Spade className="h-7 w-7 text-gold" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold">No sessions yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create a session to track buy-ins, rebuys, cash-outs, and more.
            </p>
            <Button className="mt-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <Calendar className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="text-sm font-medium">Scheduled</span>
              <span className="text-2xl font-semibold">0</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <Clock className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="text-sm font-medium">Active</span>
              <span className="text-2xl font-semibold">0</span>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </PageContainer>
  );
}
