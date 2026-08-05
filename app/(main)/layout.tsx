import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
