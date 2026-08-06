"use client";

import { Crown, DollarSign, History, Skull, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";

import { PlayerAvatar } from "@/components/player/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHOD_LABEL } from "@/lib/session/constants";
import {
  formatCurrency,
  ordinal,
  type PlayerSessionSummary,
} from "@/lib/session/services/session-engine";
import {
  buildPlayerNameMap,
  describeSessionEvent,
  getEventPlayerId,
} from "@/lib/session/services/timeline-engine";
import type { PaymentMethod, Player, SessionEvent } from "@/lib/session/types";
import { usePlayerStore } from "@/stores/player-store";
import { useSessionStore } from "@/stores/session-store";

import { PaymentMethodPicker } from "./payment-method-picker";

interface HistoryRow {
  id: string;
  label: string;
  timestamp: string;
}

function buildPlayerHistory(playerId: string, events: SessionEvent[]): HistoryRow[] {
  const names = buildPlayerNameMap(events);
  const playerName = (id: string) => names.get(id) ?? "Unknown";

  return events
    .filter((event) => getEventPlayerId(event) === playerId)
    .map((event) => ({
      id: event.id,
      label: describeSessionEvent(event, playerName),
      timestamp: event.timestamp,
    }));
}

interface PlayerQuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  player: Player;
  summary: PlayerSessionSummary;
  isDealer: boolean;
  events: SessionEvent[];
  isTournament: boolean;
}

export function PlayerQuickActionsSheet({
  open,
  onOpenChange,
  sessionId,
  player,
  summary,
  isDealer,
  events,
  isTournament,
}: PlayerQuickActionsSheetProps) {
  const addRebuy = useSessionStore((s) => s.addRebuy);
  const cashOutPlayer = useSessionStore((s) => s.cashOutPlayer);
  const eliminatePlayer = useSessionStore((s) => s.eliminatePlayer);
  const setDealer = useSessionStore((s) => s.setDealer);
  const updatePlayer = usePlayerStore((s) => s.updatePlayer);

  const [rebuyAmount, setRebuyAmount] = useState("");
  const [rebuyMethod, setRebuyMethod] = useState<PaymentMethod>("cash");
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutMethod, setCashOutMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState(player.notes ?? "");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Deferred via setTimeout: a synchronous setState at the top of an
    // effect body trips react-hooks/set-state-in-effect.
    const timeout = setTimeout(() => {
      setRebuyAmount("");
      setRebuyMethod("cash");
      setCashOutAmount(String(summary.total));
      setCashOutMethod("cash");
      setNotes(player.notes ?? "");
    }, 0);
    return () => clearTimeout(timeout);
  }, [open, player, summary.total]);

  async function handleRebuy() {
    const amount = Number(rebuyAmount);
    if (!amount || amount <= 0) return;
    setIsBusy(true);
    await addRebuy(sessionId, player.id, amount, rebuyMethod);
    setRebuyAmount("");
    setIsBusy(false);
  }

  async function handleCashOut() {
    const amount = Number(cashOutAmount);
    if (!amount && amount !== 0) return;
    setIsBusy(true);
    await cashOutPlayer(sessionId, player.id, amount, cashOutMethod);
    setIsBusy(false);
    onOpenChange(false);
  }

  async function handleEliminate() {
    setIsBusy(true);
    await eliminatePlayer(sessionId, player.id);
    setIsBusy(false);
    onOpenChange(false);
  }

  async function handleSetDealer() {
    setIsBusy(true);
    await setDealer(sessionId, player.id);
    setIsBusy(false);
  }

  async function handleSaveNotes() {
    setIsBusy(true);
    await updatePlayer(player.id, { notes });
    setIsBusy(false);
  }

  const history = buildPlayerHistory(player.id, events);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex max-h-[90dvh] flex-col overflow-hidden px-0">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <PlayerAvatar name={player.nickname || player.name} avatar={player.avatar} />
            <div className="flex flex-col">
              <SheetTitle>{player.nickname || player.name}</SheetTitle>
              <span className="text-xs text-muted-foreground">
                Seat {summary.seat} · {formatCurrency(summary.total)}
              </span>
            </div>
            {isDealer && <Badge className="ml-auto">Dealer</Badge>}
            {summary.isCashedOut && (
              <Badge variant="secondary" className="ml-auto">
                Cashed Out
              </Badge>
            )}
            {summary.isEliminated && (
              <Badge variant="secondary" className="ml-auto">
                Eliminated · {ordinal(summary.finishPosition ?? 0)}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
          {!summary.isCashedOut && !summary.isEliminated && (
            <>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-gold" aria-hidden="true" />
                  Rebuy
                </span>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={rebuyAmount}
                    onChange={(e) => setRebuyAmount(e.target.value)}
                    aria-label="Rebuy amount"
                  />
                  <Button
                    type="button"
                    onClick={() => void handleRebuy()}
                    disabled={isBusy || !rebuyAmount}
                  >
                    Add
                  </Button>
                </div>
                <PaymentMethodPicker value={rebuyMethod} onChange={setRebuyMethod} />
              </div>

              <Separator />

              {isTournament ? (
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Skull className="h-4 w-4 text-danger" aria-hidden="true" />
                    Eliminate
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Busts {player.nickname || player.name} out of the tournament. Their finishing
                    place is set automatically.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleEliminate()}
                    disabled={isBusy}
                  >
                    <Skull className="h-4 w-4" />
                    Eliminate
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Cash Out</span>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Amount"
                      value={cashOutAmount}
                      onChange={(e) => setCashOutAmount(e.target.value)}
                      aria-label="Cash out amount"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void handleCashOut()}
                      disabled={isBusy}
                    >
                      Cash Out
                    </Button>
                  </div>
                  <PaymentMethodPicker value={cashOutMethod} onChange={setCashOutMethod} />
                  {cashOutMethod !== "cash" && (
                    <p className="text-xs text-muted-foreground">
                      Recorded as owed via {PAYMENT_METHOD_LABEL[cashOutMethod]} until you mark it
                      paid in Banker.
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSetDealer()}
                disabled={isBusy || isDealer}
              >
                <Crown className="h-4 w-4" />
                {isDealer ? "Current Dealer" : "Make Dealer"}
              </Button>

              <Separator />
            </>
          )}

          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <StickyNote className="h-4 w-4 text-gold" aria-hidden="true" />
              Notes
            </span>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering about this player..."
              aria-label="Player notes"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleSaveNotes()}
              disabled={isBusy}
            >
              Save Note
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4 text-gold" aria-hidden="true" />
              History
            </span>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    <span className="text-foreground">{row.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.timestamp).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
