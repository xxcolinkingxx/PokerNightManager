import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {trend && (
            <span className="text-xs text-gold">{trend}</span>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
          <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
