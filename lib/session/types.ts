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
  | "game_ended";

export interface SessionEventPayloads {
  session_started: Record<string, never>;
  player_joined: { playerId: string; playerName: string };
  buy_in: { playerId: string; amount: number };
  rebuy: { playerId: string; amount: number };
  cash_out: { playerId: string; amount: number };
  dealer_changed: { playerId: string };
  blind_increased: { level: number; smallBlind: number; bigBlind: number };
  player_left: { playerId: string };
  break_started: Record<string, never>;
  break_ended: Record<string, never>;
  pot_updated: { amount: number; action: "set" | "add" | "clear" };
  game_ended: Record<string, never>;
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
