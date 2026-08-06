"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PlayerSessionHistoryEntry } from "@/lib/players/player-stats";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { SessionStatus } from "@/lib/session/types";

const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: "Draft",
  active: "Live",
  paused: "Paused",
  completed: "Completed",
};

interface PlayerHistoryListProps {
  history: PlayerSessionHistoryEntry[];
}

export function PlayerHistoryList({ history }: PlayerHistoryListProps) {
  const router = useRouter();

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <History className="h-6 w-6 text-gold" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No sessions played yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((entry) => (
        <button
          key={entry.sessionId}
          type="button"
          onClick={() => router.push(`/sessions/${entry.sessionId}`)}
          className="w-full text-left"
        >
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{entry.sessionName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {formatCurrency(entry.buyInTotal)}
                </span>
              </div>
              <Badge variant={entry.status === "active" ? "default" : "secondary"}>
                {STATUS_LABEL[entry.status]}
              </Badge>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
