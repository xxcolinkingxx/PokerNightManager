"use client";

import { CalendarClock, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { SessionTemplate } from "@/lib/session/types";
import { useSessionTemplateStore } from "@/stores/session-template-store";

export default function SessionTemplatesPage() {
  const templates = useSessionTemplateStore((s) => s.templates);
  const loadTemplates = useSessionTemplateStore((s) => s.loadTemplates);
  const removeTemplate = useSessionTemplateStore((s) => s.removeTemplate);

  const [deleteTarget, setDeleteTarget] = useState<SessionTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await removeTemplate(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Session Templates"
          subtitle="Saved setups for one-tap quick start"
        />

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
                <CalendarClock className="h-7 w-7 text-gold" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">No templates yet</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Check &ldquo;Save as Template&rdquo; when starting a session to add one here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {template.templateName}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {formatCurrency(template.buyIn)} · {template.host} · {template.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {template.playerIds.length === 1
                        ? "1 player"
                        : `${template.playerIds.length} players`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(template)}
                    aria-label={`Remove ${template.templateName}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AnimatedPage>

      <Sheet open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Remove {deleteTarget?.templateName}?</SheetTitle>
            <SheetDescription>
              This only removes the saved template -- past sessions started from it are
              unaffected.
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
