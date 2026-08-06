"use client";

import { ChevronRight, Plus, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBlindStructureStore } from "@/stores/blind-structure-store";

export default function BlindStructuresPage() {
  const router = useRouter();
  const blindStructures = useBlindStructureStore((s) => s.blindStructures);
  const loadBlindStructures = useBlindStructureStore((s) => s.loadBlindStructures);
  const createBlindStructure = useBlindStructureStore((s) => s.createBlindStructure);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadBlindStructures();
  }, [loadBlindStructures]);

  async function handleCreate() {
    setIsCreating(true);
    const structure = await createBlindStructure({
      name: "New Blind Structure",
      levels: [{ level: 1, smallBlind: 1, bigBlind: 2, ante: 0, durationMinutes: 20 }],
    });
    setIsCreating(false);
    router.push(`/settings/blinds/${structure.id}`);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <PageHeader
          title="Blind Structures"
          subtitle="Manage how blinds escalate"
          action={
            <Button size="sm" onClick={() => void handleCreate()} disabled={isCreating}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          }
        />

        {blindStructures.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {blindStructures.map((structure) => {
              const first = structure.levels[0];
              const last = structure.levels[structure.levels.length - 1];
              return (
                <button
                  type="button"
                  key={structure.id}
                  onClick={() => router.push(`/settings/blinds/${structure.id}`)}
                  className="w-full text-left"
                >
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                        <Timer className="h-5 w-5 text-gold" aria-hidden="true" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">
                          {structure.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {first
                            ? `${first.smallBlind}/${first.bigBlind} to ${last.smallBlind}/${last.bigBlind} · ${structure.levels.length} levels`
                            : "No levels yet"}
                        </span>
                      </div>
                      {structure.isDefault && <Badge variant="secondary">Default</Badge>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </AnimatedPage>
    </PageContainer>
  );
}
