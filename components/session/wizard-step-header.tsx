interface WizardStepHeaderProps {
  title: string;
  subtitle?: string;
}

export function WizardStepHeader({ title, subtitle }: WizardStepHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
