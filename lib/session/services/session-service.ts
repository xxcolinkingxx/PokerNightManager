import { sessionEventRepository } from "@/lib/db/repositories/session-event-repository";
import { sessionRepository } from "@/lib/db/repositories/session-repository";
import { playerRepository } from "@/lib/db/repositories/player-repository";
import { buildSessionState, getPlayerSummaries } from "@/lib/session/services/session-engine";
import type {
  PaymentMethod,
  Session,
  SessionState,
  WizardFormData,
} from "@/lib/session/types";

export class SessionService {
  async createSession(data: WizardFormData): Promise<Session> {
    return sessionRepository.create({
      name: data.name,
      host: data.host,
      location: data.location,
      type: data.type,
      buyIn: data.buyIn,
      startingStack: data.startingStack,
      chipSetId: data.chipSetId,
      blindStructureId: data.blindStructureId,
      playerIds: data.playerIds,
    });
  }

  async startSession(sessionId: string): Promise<SessionState> {
    const session = await sessionRepository.getById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "active") {
      return this.getSessionState(sessionId);
    }

    const active = await sessionRepository.getActive();
    if (active && active.id !== sessionId) {
      throw new Error("Another session is already active");
    }

    const now = new Date().toISOString();
    const updated = await sessionRepository.update(sessionId, {
      status: "active",
      startedAt: now,
    });

    await sessionEventRepository.append(sessionId, "session_started", {});

    const players = await playerRepository.getByIds(session.playerIds);
    for (const player of players) {
      await sessionEventRepository.append(sessionId, "player_joined", {
        playerId: player.id,
        playerName: player.nickname || player.name,
      });
      await sessionEventRepository.append(sessionId, "buy_in", {
        playerId: player.id,
        amount: session.buyIn,
        // Buy-ins made while setting up the table are assumed cash --
        // that's the overwhelmingly common way a home game actually
        // starts. Anything paid differently gets tagged when it happens.
        method: "cash",
      });
    }

    return this.getSessionState(updated.id);
  }

  async getSessionState(sessionId: string): Promise<SessionState> {
    const session = await sessionRepository.getById(sessionId);
    if (!session) throw new Error("Session not found");

    const events = await sessionEventRepository.getBySessionId(sessionId);
    return buildSessionState(session, events);
  }

  async updatePot(
    sessionId: string,
    action: "set" | "add" | "clear",
    amount = 0,
  ): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "pot_updated", {
      action,
      amount,
    });
    return this.getSessionState(sessionId);
  }

  async toggleBreak(sessionId: string): Promise<SessionState> {
    const state = await this.getSessionState(sessionId);
    const type = state.isOnBreak ? "break_ended" : "break_started";
    await sessionEventRepository.append(sessionId, type, {});
    return this.getSessionState(sessionId);
  }

  async increaseBlind(sessionId: string): Promise<SessionState> {
    const state = await this.getSessionState(sessionId);
    const { BLIND_STRUCTURES } = await import("@/lib/session/constants");
    const structure = BLIND_STRUCTURES.find(
      (s) => s.id === state.session.blindStructureId,
    );
    if (!structure) throw new Error("Blind structure not found");

    const nextLevel = structure.levels.find(
      (l) => l.level === state.currentBlindLevel + 1,
    );
    if (!nextLevel) throw new Error("No more blind levels");

    await sessionEventRepository.append(sessionId, "blind_increased", {
      level: nextLevel.level,
      smallBlind: nextLevel.smallBlind,
      bigBlind: nextLevel.bigBlind,
    });
    return this.getSessionState(sessionId);
  }

  async addRebuy(
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "rebuy", { playerId, amount, method });
    return this.getSessionState(sessionId);
  }

  async cashOutPlayer(
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "cash_out", { playerId, amount, method });
    return this.getSessionState(sessionId);
  }

  async eliminatePlayer(sessionId: string, playerId: string): Promise<SessionState> {
    const state = await this.getSessionState(sessionId);
    const activeCount = getPlayerSummaries(state.events).filter(
      (s) => !s.isEliminated && !s.isCashedOut,
    ).length;

    await sessionEventRepository.append(sessionId, "player_eliminated", {
      playerId,
      position: activeCount,
    });
    return this.getSessionState(sessionId);
  }

  async settlePayment(
    sessionId: string,
    playerId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "payment_settled", {
      playerId,
      amount,
      method,
    });
    return this.getSessionState(sessionId);
  }

  async recordCashCount(sessionId: string, amount: number): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "cash_recounted", { amount });
    return this.getSessionState(sessionId);
  }

  async setDealer(sessionId: string, playerId: string): Promise<SessionState> {
    await sessionEventRepository.append(sessionId, "dealer_changed", { playerId });
    return this.getSessionState(sessionId);
  }

  async addPlayerToSession(
    sessionId: string,
    playerId: string,
    buyInAmount: number,
    method: PaymentMethod,
  ): Promise<SessionState> {
    const session = await sessionRepository.getById(sessionId);
    if (!session) throw new Error("Session not found");

    const player = await playerRepository.getById(playerId);
    if (!player) throw new Error("Player not found");

    if (!session.playerIds.includes(playerId)) {
      await sessionRepository.update(sessionId, {
        playerIds: [...session.playerIds, playerId],
      });
    }

    await sessionEventRepository.append(sessionId, "player_joined", {
      playerId: player.id,
      playerName: player.nickname || player.name,
    });
    await sessionEventRepository.append(sessionId, "buy_in", {
      playerId: player.id,
      amount: buyInAmount,
      method,
    });

    return this.getSessionState(sessionId);
  }

  async endSession(sessionId: string): Promise<Session> {
    const now = new Date().toISOString();
    await sessionEventRepository.append(sessionId, "game_ended", {});
    return sessionRepository.update(sessionId, {
      status: "completed",
      endedAt: now,
    });
  }

  async listSessions(): Promise<Session[]> {
    return sessionRepository.getAll();
  }

  async getActiveSession(): Promise<Session | undefined> {
    return sessionRepository.getActive();
  }
}

export const sessionService = new SessionService();
