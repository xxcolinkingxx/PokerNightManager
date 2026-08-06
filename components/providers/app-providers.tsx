"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";

import { useKeyboardViewportFix } from "@/hooks/use-keyboard-viewport-fix";
import { initializeDatabase } from "@/lib/db/database";
import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";

import { ServiceWorkerRegister } from "./service-worker-register";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const setDbReady = useAppStore((state) => state.setDbReady);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useKeyboardViewportFix();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await initializeDatabase();
      if (!cancelled) {
        setDbReady(true);
        await loadSettings();
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setDbReady, loadSettings]);

  return (
    <MotionConfig reducedMotion="user">
      <ServiceWorkerRegister />
      {children}
    </MotionConfig>
  );
}
