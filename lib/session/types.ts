export type SessionType = "cash" | "tournament";
export type SessionStatus = "draft" | "active" | "paused" | "completed";

export interface ChipDefinition {
  color: string;
  value: number;
  label: string;
}

export interface ChipSet {
  id: string;
  name: string;
  chips: ChipDefinition[];
  isDefault: boolean;
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
  createdAt: string;
  updatedAt: string;
}

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

export interface SessionEvent<T extends SessionEventType = SessionEventType> {
  id: string;
  sessionId: string;
  type: T;
  timestamp: string;
  payload: SessionEventPayloads[T];
  sequence: number;
}

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
