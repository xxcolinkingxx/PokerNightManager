import type { GameInvite, InviteRsvp, RsvpStatus } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CreateInviteInput {
  gameName: string;
  hostName: string;
  date: string;
  location: string;
  buyIn: number | null;
  expiresInDays: number;
}

export function buildInvite(id: string, input: CreateInviteInput, now: string): GameInvite {
  const expiresAt = new Date(new Date(now).getTime() + input.expiresInDays * MS_PER_DAY).toISOString();
  return {
    id,
    gameName: input.gameName,
    hostName: input.hostName,
    date: input.date,
    location: input.location,
    buyIn: input.buyIn,
    createdAt: now,
    expiresAt,
    rsvps: [],
  };
}

export interface RsvpInput {
  guestToken: string;
  name: string;
  status: RsvpStatus;
  eta: string | null;
}

// Upserts by guestToken -- a guest revisiting their own link edits their
// existing entry in place instead of appending a duplicate. Pure so the
// merge behavior is testable without touching Redis.
export function applyRsvp(invite: GameInvite, input: RsvpInput, now: string): GameInvite {
  const entry: InviteRsvp = {
    guestToken: input.guestToken,
    name: input.name,
    status: input.status,
    eta: input.eta,
    respondedAt: now,
  };

  const existingIndex = invite.rsvps.findIndex((r) => r.guestToken === input.guestToken);
  const rsvps =
    existingIndex === -1
      ? [...invite.rsvps, entry]
      : invite.rsvps.map((r, i) => (i === existingIndex ? entry : r));

  return { ...invite, rsvps };
}

export interface RsvpSummary {
  inCount: number;
  maybeCount: number;
  outCount: number;
}

export function summarizeRsvps(invite: GameInvite): RsvpSummary {
  let inCount = 0;
  let maybeCount = 0;
  let outCount = 0;
  for (const rsvp of invite.rsvps) {
    if (rsvp.status === "in") inCount += 1;
    else if (rsvp.status === "maybe") maybeCount += 1;
    else outCount += 1;
  }
  return { inCount, maybeCount, outCount };
}
