// A guest has no account -- this token is the only thing that lets them
// reopen their own invite link later and see/edit what they already said,
// so it's generated and kept in their own browser rather than tied to a
// login. Scoped per-invite since the same guest may RSVP to many invites.
const STORAGE_PREFIX = "pnm:guest-token:";

export function getOrCreateGuestToken(inviteId: string): string {
  if (typeof window === "undefined") return "";
  const key = `${STORAGE_PREFIX}${inviteId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const token = crypto.randomUUID();
  try {
    window.localStorage.setItem(key, token);
  } catch {
    // Private browsing / storage full -- the RSVP still saves server-side,
    // it just won't be remembered for a return visit in this browser.
  }
  return token;
}
