import { PAYMENT_METHOD_LABEL } from "../constants";
import type { PaymentMethod, SessionEvent, SessionEventType } from "../types";
import { formatCurrency, ordinal } from "./session-engine";

function methodSuffix(method?: PaymentMethod): string {
  return method ? ` (${PAYMENT_METHOD_LABEL[method]})` : "";
}

// The single canonical description for every event type -- used by both
// the full session timeline and the per-player history view, so the two
// never drift out of sync with each other.
export function describeSessionEvent(
  event: SessionEvent,
  playerName: (playerId: string) => string,
): string {
  switch (event.type) {
    case "session_started":
      return "Game started";
    case "player_joined":
      return `${event.payload.playerName} joined the table`;
    case "buy_in":
      return `${playerName(event.payload.playerId)} bought in for ${formatCurrency(event.payload.amount)}${methodSuffix(event.payload.method)}`;
    case "rebuy":
      return `${playerName(event.payload.playerId)} rebought for ${formatCurrency(event.payload.amount)}${methodSuffix(event.payload.method)}`;
    case "cash_out":
      return `${playerName(event.payload.playerId)} cashed out ${formatCurrency(event.payload.amount)}${methodSuffix(event.payload.method)}`;
    case "dealer_changed":
      return `${playerName(event.payload.playerId)} became dealer`;
    case "blind_increased":
      return `Blinds increased to ${event.payload.smallBlind}/${event.payload.bigBlind}`;
    case "player_left":
      return `${playerName(event.payload.playerId)} left the table`;
    case "player_eliminated":
      return `${playerName(event.payload.playerId)} eliminated in ${ordinal(event.payload.position)} place`;
    case "break_started":
      return "Break started";
    case "break_ended":
      return "Break ended";
    case "pot_updated":
      if (event.payload.action === "clear") return "Pot cleared";
      if (event.payload.action === "set") {
        return `Pot set to ${formatCurrency(event.payload.amount)}`;
      }
      return `${formatCurrency(event.payload.amount)} added to the pot`;
    case "game_ended":
      return "Game ended";
    case "payment_settled":
      return `${playerName(event.payload.playerId)} paid ${formatCurrency(event.payload.amount)} via ${PAYMENT_METHOD_LABEL[event.payload.method]}`;
    case "cash_recounted":
      return `Cash counted: ${formatCurrency(event.payload.amount)}`;
    default:
      return "Unknown event";
  }
}

// The player an event is "about", if any -- used to filter the full
// timeline down to one player's history.
export function getEventPlayerId(event: SessionEvent): string | null {
  switch (event.type) {
    case "player_joined":
    case "buy_in":
    case "rebuy":
    case "cash_out":
    case "dealer_changed":
    case "player_left":
    case "player_eliminated":
    case "payment_settled":
      return event.payload.playerId;
    default:
      return null;
  }
}

export function buildPlayerNameMap(events: SessionEvent[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const event of events) {
    if (event.type === "player_joined") {
      names.set(event.payload.playerId, event.payload.playerName);
    }
  }
  return names;
}

export interface TimelineEntry {
  id: string;
  type: SessionEventType;
  timestamp: string;
  label: string;
}

export function buildTimeline(events: SessionEvent[]): TimelineEntry[] {
  const names = buildPlayerNameMap(events);
  const playerName = (playerId: string) => names.get(playerId) ?? "Unknown";

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    label: describeSessionEvent(event, playerName),
  }));
}
