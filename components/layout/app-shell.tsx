import { BottomNav } from "./bottom-nav";
import { RouteTransition } from "./route-transition";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 flex-col">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <BottomNav />
    </div>
  );
}
