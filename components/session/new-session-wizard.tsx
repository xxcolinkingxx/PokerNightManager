"use client";

import { useEffect } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { WIZARD_STEPS } from "@/lib/session/constants";
import type { Session } from "@/lib/session/types";
import { useWizardStore } from "@/stores/session-store";

import { BlindsStep } from "./steps/blinds-step";
import { ChipSetStep } from "./steps/chip-set-step";
import { DetailsStep } from "./steps/details-step";
import { GameTypeStep } from "./steps/game-type-step";
import { PlayersStep } from "./steps/players-step";
import { StakesStep } from "./steps/stakes-step";
import { SummaryStep } from "./steps/summary-step";
import { WizardProgress } from "./wizard-progress";

interface NewSessionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (session: Session) => void;
}

export function NewSessionWizard({ open, onOpenChange, onCreated }: NewSessionWizardProps) {
  const step = useWizardStore((s) => s.step);
  const loadPlayers = useWizardStore((s) => s.loadPlayers);

  // Resetting (or loading a template) is the opener's job -- see the
  // Sessions page's "New" and "Quick Start" handlers -- so this only
  // needs to make sure the player list is fresh, regardless of which
  // step the wizard is opened onto.
  useEffect(() => {
    if (open) void loadPlayers();
  }, [open, loadPlayers]);

  const currentIndex = Math.max(
    0,
    WIZARD_STEPS.findIndex((s) => s.id === step),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[88dvh] flex-col overflow-hidden px-6 pt-4"
      >
        <SheetTitle className="sr-only">New Session</SheetTitle>
        <WizardProgress currentIndex={currentIndex} />
        <div className="flex-1 overflow-y-auto py-4">
          {step === "details" && <DetailsStep />}
          {step === "game-type" && <GameTypeStep />}
          {step === "stakes" && <StakesStep />}
          {step === "chip-set" && <ChipSetStep />}
          {step === "blinds" && <BlindsStep />}
          {step === "players" && <PlayersStep />}
          {step === "summary" && (
            <SummaryStep
              onDone={(session) => {
                onOpenChange(false);
                onCreated(session);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
