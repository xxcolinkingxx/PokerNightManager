"use client";

import { Calendar, Clock, Plus, Send, Spade } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateInviteSheet } from "@/components/invites/create-invite-sheet";
import { NewSessionWizard } from "@/components/session/new-session-wizard";
import { AnimatedPage } from "@/components/shared/animated-page";
import { StaggerItem, StaggerList } from "@/components/shared/stagger-list";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHostInvites, type HostInviteLogEntry } from "@/lib/invites/host-invite-log";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { Session, SessionTemplate } from "@/lib/session/types";
import { useSessionTemplateStore } from "@/stores/session-template-store";
import { useSessionStore, useWizardStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";

function formatInviteDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const templates = useSessionTemplateStore((s) => s.templates);
  const loadTemplates = useSessionTemplateStore((s) => s.loadTemplates);
  const wizardReset = useWizardStore((s) => s.reset);
  const loadFromTemplate = useWizardStore((s) => s.loadFromTemplate);
  const wizardOpen = useWizardStore((s) => s.isOpen);
  const setWizardOpen = useWizardStore((s) => s.setOpen);
  const settings = useSettingsStore((s) => s.settings);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hostInvites, setHostInvites] = useState<HostInviteLogEntry[]>([]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    async function load() {
      setHostInvites(getHostInvites());
    }
    void load();
  }, [inviteOpen]);

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const scheduledCount = sessions.filter((s) => s.status === "draft").length;

  function handleCreated(session: Session) {
    router.push(`/sessions/${session.id}`);
  }

  function handleNewSession() {
    wizardReset({
      host: settings?.hostName || "",
      location: settings?.defaultLocation || "",
    });
    setWizardOpen(true);
  }

  function handleQuickStart(template: SessionTemplate) {
    loadFromTemplate(template);
    setWizardOpen(true);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Sessions"
          subtitle="Manage your poker nights"
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Invite guests"
                onClick={() => setInviteOpen(true)}
              >
                <Send className="h-4 w-4" />
                Invite
              </Button>
              <Button size="sm" aria-label="Create new session" onClick={handleNewSession}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          }
        />

        {templates.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">Quick Start</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleQuickStart(template)}
                  className="shrink-0"
                >
                  <Card>
                    <CardContent className="flex w-40 flex-col gap-1 p-3.5 text-left">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {template.templateName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(template.buyIn)} ·{" "}
                        {template.playerIds.length === 1
                          ? "1 player"
                          : `${template.playerIds.length} players`}
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {hostInvites.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-foreground">My Invites</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {hostInvites.map((invite) => (
                <button
                  key={invite.id}
                  type="button"
                  onClick={() => router.push(`/invites/${invite.id}`)}
                  className="shrink-0"
                >
                  <Card>
                    <CardContent className="flex w-40 flex-col gap-1 p-3.5 text-left">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {invite.gameName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatInviteDateLabel(invite.date)}
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

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
              <Button className="mt-2" onClick={handleNewSession}>
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <StaggerList>
            {sessions.map((session) => (
              <StaggerItem key={session.id}>
                <button
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
              </StaggerItem>
            ))}
          </StaggerList>
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

      <CreateInviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        defaultHostName={settings?.hostName || ""}
        defaultLocation={settings?.defaultLocation || ""}
      />
    </PageContainer>
  );
}
