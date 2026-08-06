import { getRedisClient } from "./redis-client";
import { applyRsvp, buildInvite, type CreateInviteInput, type RsvpInput } from "./invite-logic";
import { generateId } from "@/lib/session/services/session-engine";
import type { GameInvite } from "./types";

// Invites are meant for one specific, near-term game, not to live
// forever -- 90 days is generous for that while keeping old, long-dead
// links from just accumulating in the free-tier store indefinitely.
const INVITE_TTL_SECONDS = 60 * 60 * 24 * 90;

function inviteKey(id: string): string {
  return `invite:${id}`;
}

export async function createInvite(input: CreateInviteInput): Promise<GameInvite> {
  const redis = getRedisClient();
  const invite = buildInvite(generateId(), input, new Date().toISOString());
  await redis.set(inviteKey(invite.id), invite, { ex: INVITE_TTL_SECONDS });
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
  await redis.set(inviteKey(id), updated, { ex: INVITE_TTL_SECONDS });
  return updated;
}
