"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Coins,
  Download,
  MapPin,
  TriangleAlert,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { exportBackup, parseBackupFile, restoreBackup, type BackupFile } from "@/lib/backup/backup-service";
import { useSettingsStore } from "@/stores/settings-store";

const settingsSchema = z.object({
  hostName: z.string().max(100),
  defaultLocation: z.string().max(200),
  hapticsEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

type BackupStatus =
  | { state: "idle" }
  | { state: "exporting" }
  | { state: "exported" }
  | { state: "restoring" }
  | { state: "error"; message: string };

const EASTER_EGG_URL = "https://www.tiktok.com/@panzersoldat?_r=1&_t=ZT-98fCpHkFEaL";
const EASTER_EGG_TAP_WINDOW_MS = 800;
const EASTER_EGG_TAPS_REQUIRED = 3;

function Element115Badge() {
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  function handleTap() {
    const now = Date.now();
    const withinWindow = now - lastTapRef.current < EASTER_EGG_TAP_WINDOW_MS;
    lastTapRef.current = now;
    tapCountRef.current = withinWindow ? tapCountRef.current + 1 : 1;

    if (tapCountRef.current >= EASTER_EGG_TAPS_REQUIRED) {
      tapCountRef.current = 0;
      window.open(EASTER_EGG_URL, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="115"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground transition-transform active:scale-90"
    >
      115
    </button>
  );
}

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettingsStore();

  const [backupStatus, setBackupStatus] = useState<BackupStatus>({ state: "idle" });
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      hostName: "",
      defaultLocation: "",
      hapticsEnabled: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        hostName: settings.hostName,
        defaultLocation: settings.defaultLocation,
        hapticsEnabled: settings.hapticsEnabled,
      });
    }
  }, [settings, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await updateSettings(values);
  });

  async function handleExport() {
    setBackupStatus({ state: "exporting" });
    try {
      const blob = await exportBackup();
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `poker-night-manager-backup-${stamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setBackupStatus({ state: "exported" });
    } catch {
      setBackupStatus({ state: "error", message: "Couldn't export your data. Try again." });
    }
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = await parseBackupFile(file);
      setPendingRestore(backup);
    } catch (error) {
      setBackupStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Couldn't read that file.",
      });
    }
  }

  async function handleConfirmRestore() {
    if (!pendingRestore) return;
    setBackupStatus({ state: "restoring" });
    try {
      await restoreBackup(pendingRestore);
      setPendingRestore(null);
      window.location.reload();
    } catch {
      setPendingRestore(null);
      setBackupStatus({ state: "error", message: "Restore failed. Your data wasn't changed." });
    }
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Settings"
          subtitle="Configure your poker nights"
          action={<Element115Badge />}
        />

        <Link href="/settings/chips">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <Coins className="h-5 w-5 text-gold" aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Chip Sets</span>
                <span className="text-xs text-muted-foreground">
                  Inventory, calculator, and custom sets
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/templates">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <CalendarClock className="h-5 w-5 text-gold" aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Session Templates</span>
                <span className="text-xs text-muted-foreground">Saved setups for quick start</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-gold" aria-hidden="true" />
                Host Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hostName">Your Name</Label>
                <Input
                  id="hostName"
                  placeholder="Colin"
                  disabled={isLoading}
                  {...form.register("hostName")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="defaultLocation">Default Location</Label>
                <Input
                  id="defaultLocation"
                  placeholder="Home game room"
                  disabled={isLoading}
                  {...form.register("defaultLocation")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-gold" aria-hidden="true" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Haptic Feedback</span>
                  <span className="text-xs text-muted-foreground">
                    Vibrate on key actions
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-gold"
                  disabled={isLoading}
                  {...form.register("hapticsEnabled")}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-4 w-4 text-gold" aria-hidden="true" />
                Backup &amp; Restore
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Export everything -- players, sessions, chip sets -- as a single file you can
                keep somewhere safe or move to a new device.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleExport()}
                disabled={backupStatus.state === "exporting"}
              >
                <Download className="h-4 w-4" />
                {backupStatus.state === "exporting" ? "Exporting..." : "Export Data"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={backupStatus.state === "restoring"}
              >
                <Upload className="h-4 w-4" />
                {backupStatus.state === "restoring" ? "Restoring..." : "Restore from Backup"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                aria-label="Backup file"
                className="hidden"
                onChange={(e) => void handleFileSelected(e)}
              />
              {backupStatus.state === "exported" && (
                <p className="text-xs text-success">Backup downloaded.</p>
              )}
              {backupStatus.state === "error" && (
                <p className="flex items-center gap-1.5 text-xs text-danger">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {backupStatus.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Poker Night Manager v1.0.0</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                All data is stored locally on your device. Works fully offline.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
            Save Settings
          </Button>
        </form>
      </AnimatedPage>

      <Sheet
        open={pendingRestore !== null}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Restore from backup?</SheetTitle>
            <SheetDescription>
              This replaces everything currently on this device -- players, sessions, chip
              sets, and settings -- with the contents of this backup
              {pendingRestore
                ? ` from ${new Date(pendingRestore.exportedAt).toLocaleDateString()}`
                : ""}
              . This can&apos;t be undone.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setPendingRestore(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmRestore()}>
              Restore
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
