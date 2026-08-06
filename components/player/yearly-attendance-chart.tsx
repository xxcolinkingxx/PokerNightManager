"use client";

import { motion } from "framer-motion";

import { animation } from "@/lib/theme/tokens";
import type { YearlyAttendance } from "@/lib/players/player-stats";

interface YearlyAttendanceChartProps {
  data: YearlyAttendance[];
}

export function YearlyAttendanceChart({ data }: YearlyAttendanceChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => (
        <div key={d.year} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{d.year}</span>
            <span className="text-muted-foreground">
              {d.count} {d.count === 1 ? "session" : "sessions"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={animation.ease}
              className="h-full rounded-full bg-gold"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
