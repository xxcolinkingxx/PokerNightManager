import { create } from "zustand";

import { playerRepository } from "@/lib/db/repositories/player-repository";
import { triggerHaptic } from "@/lib/haptics";
import { sessionService } from "@/lib/session/services/session-service";
import { DEFAULT_BLIND_STRUCTURE } from "@/lib/session/constants";
import type {
  PaymentMethod,
  Player,
  Session,
  SessionState,
  SessionTemplate,
  WizardFormData,
  WizardStep,
} from "@/lib/session/types";

const defaultWizardData: WizardFormData = {
  name: "",
  host: "",
  location: "",
  type: "cash",
  buyIn: 20,
  startingStack: 2000,
  // Matches the fixed id the default chip set is seeded with in database.ts.
  chipSetId: "default",
  blindStructureId: DEFAULT_BLIND_STRUCTURE.id,
  playerIds: [],
};

interface WizardState {
  step: WizardStep;
  data: WizardFormData;
  players: Player[];
  isLoading: boolean;
  setStep: (step: WizardStep) => void;
  updateData: (partial: Partial<WizardFormData>) => void;
  loadPlayers: () => Promise<void>;
  addPlayer: (name: string) => Promise<Player>;
  togglePlayer: (playerId: string) => void;
  reset: (defaults?: Partial<WizardFormData>) => void;
  loadFromTemplate: (template: SessionTemplate) => void;
  createAndStart: () => Promise<Session>;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  step: "details",
  data: defaultWizardData,
  players: [],
  isLoading: false,

  setStep: (step) => set({ step }),

  updateData: (partial) =>
    set((state) => ({ data: { ...state.data, ...partial } })),

  loadPlayers: async () => {
    set({ isLoading: true });
    const players = await playerRepository.getAll();
    set({ players, isLoading: false });
  },

  addPlayer: async (name) => {
    const player = await playerRepository.create(name);
    set((state) => ({ players: [...state.players, player] }));
    return player;
  },

  togglePlayer: (playerId) => {
    set((state) => {
      const ids = state.data.playerIds.includes(playerId)
        ? state.data.playerIds.filter((id) => id !== playerId)
        : [...state.data.playerIds, playerId];
      return { data: { ...state.data, playerIds: ids } };
    });
  },

  reset: (defaults) =>
    set({
      step: "details",
      data: { ...defaultWizardData, ...defaults },
      isLoading: false,
    }),

  loadFromTemplate: (template) => {
    const data: WizardFormData = {
      name: template.name,
      host: template.host,
      location: template.location,
      type: template.type,
      buyIn: template.buyIn,
      startingStack: template.startingStack,
      chipSetId: template.chipSetId,
      blindStructureId: template.blindStructureId,
      playerIds: template.playerIds,
    };
    set({ step: "summary", data, isLoading: false });
  },

  createAndStart: async () => {
    const { data } = get();
    const session = await sessionService.createSession(data);
    await sessionService.startSession(session.id);
    return session;
  },
}));

interface SessionStoreState {
  sessions: Session[];
  activeSession: Session | null;
  liveState: SessionState | null;
  isLoading: boolean;
  loadSessions: () => Promise<void>;
  loadActiveSession: () => Promise<void>;
  loadLiveState: (sessionId: string) => Promise<void>;
  updatePot: (
    sessionId: string,
    action: "set" | "add" | "clear",
    amount?: number,
  ) => Promise<void>;
  toggleBreak: (sessionId: string) => Promise<void>;
  increaseBlind: (sessionId: string) => Promise<void>;
  addRebuy: (
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ) => Promise<void>;
  cashOutPlayer: (
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ) => Promise<void>;
  eliminatePlayer: (sessionId: string, playerId: string) => Promise<void>;
  setDealer: (sessionId: string, playerId: string) => Promise<void>;
  addPlayerToSession: (
    sessionId: string,
    playerId: string,
    buyInAmount: number,
    method: PaymentMethod,
  ) => Promise<void>;
  settlePayment: (
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ) => Promise<void>;
  recordCashCount: (sessionId: string, amount: number) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  sessions: [],
  activeSession: null,
  liveState: null,
  isLoading: false,

  loadSessions: async () => {
    set({ isLoading: true });
    const sessions = await sessionService.listSessions();
    set({ sessions, isLoading: false });
  },

  loadActiveSession: async () => {
    const activeSession = await sessionService.getActiveSession();
    set({ activeSession: activeSession ?? null });
  },

  loadLiveState: async (sessionId) => {
    const liveState = await sessionService.getSessionState(sessionId);
    set({ liveState });
  },

  updatePot: async (sessionId, action, amount) => {
    const liveState = await sessionService.updatePot(sessionId, action, amount);
    set({ liveState });
  },

  toggleBreak: async (sessionId) => {
    const liveState = await sessionService.toggleBreak(sessionId);
    set({ liveState });
  },

  increaseBlind: async (sessionId) => {
    const liveState = await sessionService.increaseBlind(sessionId);
    triggerHaptic("tap");
    set({ liveState });
  },

  addRebuy: async (sessionId, playerId, amount, method) => {
    const liveState = await sessionService.addRebuy(sessionId, playerId, amount, method);
    triggerHaptic("tap");
    set({ liveState });
  },

  cashOutPlayer: async (sessionId, playerId, amount, method) => {
    const liveState = await sessionService.cashOutPlayer(sessionId, playerId, amount, method);
    triggerHaptic("success");
    set({ liveState });
  },

  eliminatePlayer: async (sessionId, playerId) => {
    const liveState = await sessionService.eliminatePlayer(sessionId, playerId);
    triggerHaptic("warning");
    set({ liveState });
  },

  setDealer: async (sessionId, playerId) => {
    const liveState = await sessionService.setDealer(sessionId, playerId);
    set({ liveState });
  },

  addPlayerToSession: async (sessionId, playerId, buyInAmount, method) => {
    const liveState = await sessionService.addPlayerToSession(
      sessionId,
      playerId,
      buyInAmount,
      method,
    );
    set({ liveState });
  },

  settlePayment: async (sessionId, playerId, amount, method) => {
    const liveState = await sessionService.settlePayment(sessionId, playerId, amount, method);
    triggerHaptic("tap");
    set({ liveState });
  },

  recordCashCount: async (sessionId, amount) => {
    const liveState = await sessionService.recordCashCount(sessionId, amount);
    set({ liveState });
  },

  endSession: async (sessionId) => {
    await sessionService.endSession(sessionId);
    triggerHaptic("success");
    set({ liveState: null, activeSession: null });
  },
}));
