export type SessionType = "cash" | "tournament";
export type SessionStatus = "draft" | "active" | "paused" | "completed";

export interface ChipDefinition {
  color: string;
  value: number;
  label: string;
  quantityOwned: number;
}

export interface ChipSet {
  id: string;
  name: string;
  chips: ChipDefinition[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
}

export interface BlindStructure {
  id: string;
  name: string;
  levels: BlindLevel[];
  isDefault: boolean;
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar?: Blob;
  phone?: string;
  notes?: string;
  venmo?: string;
  cashApp?: string;
  appleCash?: string;
  zelle?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlayerProfileFields = Pick<
  Player,
  "name" | "nickname" | "avatar" | "phone" | "notes" | "venmo" | "cashApp" | "appleCash" | "zelle"
>;

export interface Session {
  id: string;
  name: string;
  host: string;
  location: string;
  type: SessionType;
  buyIn: number;
  startingStack: number;
  chipSetId: string;
  blindStructureId: string;
  playerIds: string[];
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "cash" | "venmo" | "cash_app" | "apple_cash" | "zelle";

export type SessionEventType =
  | "session_started"
  | "player_joined"
  | "buy_in"
  | "rebuy"
  | "cash_out"
  | "dealer_changed"
  | "blind_increased"
  | "player_left"
  | "break_started"
  | "break_ended"
  | "pot_updated"
  | "game_ended"
  | "payment_settled"
  | "cash_recounted";

export interface SessionEventPayloads {
  session_started: Record<string, never>;
  player_joined: { playerId: string; playerName: string };
  // `method` is optional so sessions created before Banker Mode existed
  // still deserialize fine -- their transactions just weren't tagged with
  // a payment method, and Banker Mode treats that as genuinely unknown
  // rather than assuming cash.
  buy_in: { playerId: string; amount: number; method?: PaymentMethod };
  rebuy: { playerId: string; amount: number; method?: PaymentMethod };
  cash_out: { playerId: string; amount: number; method?: PaymentMethod };
  dealer_changed: { playerId: string };
  blind_increased: { level: number; smallBlind: number; bigBlind: number };
  player_left: { playerId: string };
  break_started: Record<string, never>;
  break_ended: Record<string, never>;
  pot_updated: { amount: number; action: "set" | "add" | "clear" };
  game_ended: Record<string, never>;
  // Recorded when the host actually sends a previously-outstanding
  // non-cash cash-out (e.g. finally Venmo-ing someone their winnings).
  payment_settled: { playerId: string; amount: number; method: PaymentMethod };
  // A manual physical cash count, for reconciling against the cash
  // expected from tagged cash buy-ins/rebuys/cash-outs.
  cash_recounted: { amount: number };
}

interface SessionEventBase<T extends SessionEventType> {
  id: string;
  sessionId: string;
  type: T;
  timestamp: string;
  payload: SessionEventPayloads[T];
  sequence: number;
}

// Indexing a mapped type by its own key distributes over the union,
// so this yields a real discriminated union (narrowable on `type`)
// instead of a single shape with `type`/`payload` as unrelated unions.
export type SessionEvent<T extends SessionEventType = SessionEventType> = {
  [K in T]: SessionEventBase<K>;
}[T];

export interface SessionState {
  session: Session;
  events: SessionEvent[];
  elapsedMs: number;
  isOnBreak: boolean;
  currentPot: number;
  currentBlindLevel: number;
}

export interface SessionWithEvents {
  session: Session;
  events: SessionEvent[];
}

export interface WizardFormData {
  name: string;
  host: string;
  location: string;
  type: SessionType;
  buyIn: number;
  startingStack: number;
  chipSetId: string;
  blindStructureId: string;
  playerIds: string[];
}

export type WizardStep =
  | "details"
  | "game-type"
  | "stakes"
  | "chip-set"
  | "blinds"
  | "players"
  | "summary";
