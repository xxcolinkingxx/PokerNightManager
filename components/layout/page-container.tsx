import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 pb-28 pt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
