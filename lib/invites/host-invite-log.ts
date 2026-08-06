// There are no host accounts -- Redis only knows an invite by its ID, so
// the host's own browser is the only place that remembers which invites
// they've created. Kept in localStorage (not Dexie) since it's a small,
// disposable pointer list, not session data worth backing up/restoring.
const STORAGE_KEY = "pnm:host-invites";
const MAX_ENTRIES = 25;

export interface HostInviteLogEntry {
  id: string;
  gameName: string;
  date: string;
  createdAt: string;
}

export function getHostInvites(): HostInviteLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HostInviteLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHostInvite(entry: HostInviteLogEntry): void {
  if (typeof window === "undefined") return;
  const existing = getHostInvites().filter((invite) => invite.id !== entry.id);
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable (e.g. private browsing) -- the invite
    // still exists in Redis and is still shareable, it just won't show up
    // in this browser's "My Invites" list.
  }
}
