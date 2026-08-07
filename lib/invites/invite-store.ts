import { getRedisClient } from "./redis-client";
import { applyRsvp, buildInvite, type CreateInviteInput, type RsvpInput } from "./invite-logic";
import { DEFAULT_INVITE_EXPIRY_DAYS } from "./schemas";
import { generateId } from "@/lib/session/services/session-engine";
import type { GameInvite } from "./types";

function inviteKey(id: string): string {
  return `invite:${id}`;
}

// Redis's TTL is always "seconds from now," but the invite's own
// expiresAt is a fixed point in time chosen once at creation -- every
// write (including an RSVP re-save) has to re-derive the remaining
// seconds from that fixed point rather than resetting the clock.
// Clamped to at least 1s so a just-expired invite doesn't fail the SET
// outright if it's re-saved in the same instant it expires. Falls back
// to the default window for an invite saved before expiresAt existed.
function remainingTtlSeconds(expiresAt: string | undefined): number {
  const target = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  if (Number.isNaN(target)) {
    return DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60;
  }
  return Math.max(1, Math.round((target - Date.now()) / 1000));
}

export async function createInvite(input: CreateInviteInput): Promise<GameInvite> {
  const redis = getRedisClient();
  const invite = buildInvite(generateId(), input, new Date().toISOString());
  await redis.set(inviteKey(invite.id), invite, { ex: remainingTtlSeconds(invite.expiresAt) });
  return invite;
}

export async function getInvite(id: string): Promise<GameInvite | null> {
  const redis = getRedisClient();
  const invite = await redis.get<GameInvite>(inviteKey(id));
  return invite ?? null;
}

// Null return means the invite doesn't exist (bad/expired link) --
// distinct from a validation failure, which the caller handles before
// ever getting here.
export async function submitRsvp(id: string, input: RsvpInput): Promise<GameInvite | null> {
  const redis = getRedisClient();
  const existing = await redis.get<GameInvite>(inviteKey(id));
  if (!existing) return null;

  const updated = applyRsvp(existing, input, new Date().toISOString());
  await redis.set(inviteKey(id), updated, { ex: remainingTtlSeconds(updated.expiresAt) });
  return updated;
}
