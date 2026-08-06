"use client";

import { AlertCircle, MapPin, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { Session } from "@/lib/session/types";
import { useWizardStore } from "@/stores/session-store";

import { WizardStepFooter } from "../wizard-step-footer";
import { WizardStepHeader } from "../wizard-step-header";

interface SummaryStepProps {
  onDone: (session: Session) => void;
}

export function SummaryStep({ onDone }: SummaryStepProps) {
  const data = useWizardStore((s) => s.data);
  const players = useWizardStore((s) => s.players);
  const setStep = useWizardStore((s) => s.setStep);
  const createAndStart = useWizardStore((s) => s.createAndStart);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlayers = players.filter((p) => data.playerIds.includes(p.id));

  async function handleStart() {
    setIsStarting(true);
    setError(null);
    try {
      const session = await createAndStart();
      onDone(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the session");
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <WizardStepHeader title="Ready to deal?" subtitle="Review your session before you start." />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-foreground">{data.name}</span>
          <Badge>{data.type === "cash" ? "Cash Game" : "Tournament"}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          {data.location}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Buy-In</span>
            <span className="font-semibold text-foreground">{formatCurrency(data.buyIn)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Starting Stack</span>
            <span className="font-semibold text-foreground">
              {data.startingStack.toLocaleString()}
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          {selectedPlayers.length} players
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedPlayers.map((p) => (
            <Badge key={p.id} variant="secondary">
              {p.nickname || p.name}
            </Badge>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <WizardStepFooter
        onBack={() => setStep("players")}
        onContinue={() => void handleStart()}
        submitLabel={isStarting ? "Starting..." : "Start Game"}
        isSubmitting={isStarting}
      />
    </div>
  );
}
