"use client";

import { ArrowLeft, Banknote, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedPage } from "@/components/shared/animated-page";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeBankerSummary } from "@/lib/banker/banker-engine";
import { PAYMENT_METHOD_LABEL } from "@/lib/session/constants";
import { formatCurrency } from "@/lib/session/services/session-engine";
import type { PaymentMethod } from "@/lib/session/types";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

export default function BankerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const liveState = useSessionStore((s) => s.liveState);
  const loadLiveState = useSessionStore((s) => s.loadLiveState);
  const settlePayment = useSessionStore((s) => s.settlePayment);
  const recordCashCount = useSessionStore((s) => s.recordCashCount);

  const [countInput, setCountInput] = useState("");
  const [isSavingCount, setIsSavingCount] = useState(false);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLiveState(sessionId).catch(() => {
      if (!cancelled) setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, loadLiveState]);

  if (notFound) {
    return (
      <PageContainer>
        <AnimatedPage>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <h2 className="text-lg font-semibold">Session not found</h2>
              <Button onClick={() => router.push("/sessions")}>Back to Sessions</Button>
            </CardContent>
          </Card>
        </AnimatedPage>
      </PageContainer>
    );
  }

  if (!liveState) {
    return (
      <PageContainer>
        <AnimatedPage>
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Loading...
          </div>
        </AnimatedPage>
      </PageContainer>
    );
  }

  const summary = computeBankerSummary(liveState.events);

  async function handleSaveCount() {
    const amount = Number(countInput);
    if (!amount && amount !== 0) return;
    setIsSavingCount(true);
    await recordCashCount(sessionId, amount);
    setCountInput("");
    setIsSavingCount(false);
  }

  async function handleSettle(playerId: string, amount: number, method: PaymentMethod) {
    const key = `${playerId}:${method}`;
    setSettlingKey(key);
    await settlePayment(sessionId, playerId, amount, method);
    setSettlingKey(null);
  }

  return (
    <PageContainer>
      <AnimatedPage>
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-label="Back to session"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 text-lg font-semibold text-foreground">Banker</span>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-gold" aria-hidden="true" />
              Cash Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Cash</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(summary.expectedCash)}
              </span>
            </div>

            {summary.actualCash !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Count</span>
                <span className="text-lg font-semibold text-foreground">
                  {formatCurrency(summary.actualCash)}
                </span>
              </div>
            )}

            {summary.difference !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Difference</span>
                <span
                  className={cn(
                    "text-lg font-semibold",
                    summary.difference === 0
                      ? "text-success"
                      : summary.difference > 0
                        ? "text-gold"
                        : "text-danger",
                  )}
                >
                  {summary.difference > 0 ? "+" : ""}
                  {formatCurrency(summary.difference)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="cash-count">Count Actual Cash</Label>
              <div className="flex gap-2">
                <Input
                  id="cash-count"
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => void handleSaveCount()}
                  disabled={isSavingCount || !countInput}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {summary.byMethod.map((row) => (
              <div key={row.method} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{PAYMENT_METHOD_LABEL[row.method]}</span>
                <span className="text-muted-foreground">
                  +{formatCurrency(row.collected)} / -{formatCurrency(row.paidOut)}
                </span>
              </div>
            ))}
            {summary.untaggedAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.untaggedAmount)} from before Banker Mode wasn&apos;t
                tagged with a payment method.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Outstanding Payments</span>
          {summary.outstanding.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {summary.outstanding.map((row) => {
                const key = `${row.playerId}:${row.method}`;
                return (
                  <Card key={key}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {row.playerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(row.amount)} via {PAYMENT_METHOD_LABEL[row.method]}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={settlingKey === key}
                        onClick={() => void handleSettle(row.playerId, row.amount, row.method)}
                      >
                        Mark Paid
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AnimatedPage>
    </PageContainer>
  );
}
