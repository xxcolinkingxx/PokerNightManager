"use client";

import { ChevronRight, Coins, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CHIP_DENOMINATIONS } from "@/lib/session/constants";
import { useChipStore } from "@/stores/chip-store";

export default function ChipSetsPage() {
  const router = useRouter();
  const chipSets = useChipStore((s) => s.chipSets);
  const loadChipSets = useChipStore((s) => s.loadChipSets);
  const createChipSet = useChipStore((s) => s.createChipSet);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadChipSets();
  }, [loadChipSets]);

  async function handleCreate() {
    setIsCreating(true);
    const chipSet = await createChipSet({
      name: "New Chip Set",
      chips: DEFAULT_CHIP_DENOMINATIONS.map((chip) => ({ ...chip, quantityOwned: 0 })),
    });
    setIsCreating(false);
    router.push(`/settings/chips/${chipSet.id}`);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Chip Sets"
          subtitle="Manage your chip inventory"
          action={
            <Button size="sm" onClick={() => void handleCreate()} disabled={isCreating}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          }
        />

        {chipSets.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chipSets.map((chipSet) => (
              <button
                type="button"
                key={chipSet.id}
                onClick={() => router.push(`/settings/chips/${chipSet.id}`)}
                className="w-full text-left"
              >
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                      <Coins className="h-5 w-5 text-gold" aria-hidden="true" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">{chipSet.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {chipSet.chips.length} denominations
                      </span>
                    </div>
                    {chipSet.isDefault && <Badge variant="secondary">Default</Badge>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </AnimatedPage>
    </PageContainer>
  );
}
