"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WizardStepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function WizardStepFooter({
  onBack,
  onContinue,
  submitLabel,
  isSubmitting,
  disabled,
}: WizardStepFooterProps) {
  return (
    <div className="mt-2 flex items-center gap-3">
      {onBack && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <Button
        type={onContinue ? "button" : "submit"}
        className="flex-1"
        onClick={onContinue}
        disabled={isSubmitting || disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
