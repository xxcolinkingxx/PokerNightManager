import { WIZARD_STEPS } from "@/lib/session/constants";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentIndex: number;
}

export function WizardProgress({ currentIndex }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length}>
      {WIZARD_STEPS.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
            index <= currentIndex ? "bg-gold" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
