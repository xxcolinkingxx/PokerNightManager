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
  rsvps: InviteRsvp[];
}
