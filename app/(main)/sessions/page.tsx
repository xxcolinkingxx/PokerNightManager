"use client";

import { Calendar, Clock, Plus, Spade } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NewSessionWizard } from "@/components/session/new-session-wizard";
import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Session } from "@/lib/session/types";
import { useSessionStore } from "@/stores/session-store";

const STATUS_LABEL: Record<Session["status"], string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export default function SessionsPage() {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const loadSessions = useSessionStore((s) => s.loadSessions);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const scheduledCount = sessions.filter((s) => s.status === "draft").length;

  function handleCreated(session: Session) {
    router.push(`/sessions/${session.id}`);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Sessions"
          subtitle="Manage your poker nights"
          action={
            <Button size="sm" aria-label="Create new session" onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          }
        />

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                <Spade className="h-7 w-7 text-gold" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">No sessions yet</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Create a session to track buy-ins, rebuys, cash-outs, and more.
              </p>
              <Button className="mt-2" onClick={() => setWizardOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => router.push(`/sessions/${session.id}`)}
                className="w-full text-left"
              >
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        {session.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.host} · {session.location}
                      </span>
                    </div>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABEL[session.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <Calendar className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="text-sm font-medium">Scheduled</span>
              <span className="text-2xl font-semibold">{scheduledCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <Clock className="h-5 w-5 text-gold" aria-hidden="true" />
              <span className="text-sm font-medium">Active</span>
              <span className="text-2xl font-semibold">{activeCount}</span>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>

      <NewSessionWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={handleCreated}
      />
    </PageContainer>
  );
}
