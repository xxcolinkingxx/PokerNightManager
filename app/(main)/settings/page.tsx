"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, MapPin, User } from "lucide-react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/stores/settings-store";

const settingsSchema = z.object({
  hostName: z.string().max(100),
  defaultLocation: z.string().max(200),
  hapticsEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettingsStore();

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

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Settings"
          subtitle="Configure your poker nights"
        />

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
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Poker Night Manager v0.1.0</span>
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
    </PageContainer>
  );
}
