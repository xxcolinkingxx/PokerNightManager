export type RsvpStatus = "in" | "out" | "maybe";

export interface InviteRsvp {
  // Random, generated client-side and stashed in the guest's own browser
  // storage -- lets them revisit the link and edit their own response
  // without creating a duplicate entry or needing any kind of account.
  guestToken: string;
  name: string;
  status: RsvpStatus;
  eta: string | null;
  respondedAt: string;
}

export interface GameInvite {
  id: string;
  gameName: string;
  hostName: string;
  date: string;
  location: string;
  // Null = host hasn't locked in a buy-in yet ("TBD" to guests).
  buyIn: number | null;
  createdAt: string;
  // Fixed at creation time from the host's chosen expiry window and never
  // extended by later activity (e.g. a guest RSVPing) -- see invite-store's
  // submitRsvp, which re-saves with the *remaining* TTL, not a fresh one.
  expiresAt: string;
  rsvps: InviteRsvp[];
}
