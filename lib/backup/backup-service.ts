import { db } from "@/lib/db/database";
import type { AppSettings } from "@/lib/db/types";
import type {
  BlindStructure,
  ChipSet,
  Player,
  Session,
  SessionEvent,
  SessionTemplate,
} from "@/lib/session/types";

const BACKUP_APP_ID = "PokerNightManager";
const BACKUP_VERSION = 3;

// Player.avatar is a Blob, which isn't JSON-serializable -- swap it for a
// data URL on the way out and back for a round trip through plain JSON.
type SerializedPlayer = Omit<Player, "avatar"> & { avatar?: string };

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: {
    settings: AppSettings[];
    players: SerializedPlayer[];
    sessions: Session[];
    sessionEvents: SessionEvent[];
    chipSets: ChipSet[];
    // Absent in backups made before session templates existed (version 1).
    sessionTemplates?: SessionTemplate[];
    // Absent in backups made before custom blind structures existed
    // (version 1-2).
    blindStructures?: BlindStructure[];
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function exportBackup(): Promise<Blob> {
  const [settings, players, sessions, sessionEvents, chipSets, sessionTemplates, blindStructures] =
    await Promise.all([
      db.settings.toArray(),
      db.players.toArray(),
      db.sessions.toArray(),
      db.sessionEvents.toArray(),
      db.chipSets.toArray(),
      db.sessionTemplates.toArray(),
      db.blindStructures.toArray(),
    ]);

  const serializedPlayers: SerializedPlayer[] = await Promise.all(
    players.map(async (player) => ({
      ...player,
      avatar: player.avatar ? await blobToDataUrl(player.avatar) : undefined,
    })),
  );

  const backup: BackupFile = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings,
      players: serializedPlayers,
      sessions,
      sessionEvents,
      chipSets,
      sessionTemplates,
      blindStructures,
    },
  };

  return new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
}

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== "object" || value === null) return false;
  const root = value as Record<string, unknown>;
  if (root.app !== BACKUP_APP_ID) return false;
  if (typeof root.data !== "object" || root.data === null) return false;

  const data = root.data as Record<string, unknown>;
  return (
    Array.isArray(data.settings) &&
    Array.isArray(data.players) &&
    Array.isArray(data.sessions) &&
    Array.isArray(data.sessionEvents) &&
    Array.isArray(data.chipSets)
  );
}

export async function parseBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!isBackupFile(parsed)) {
    throw new Error("That doesn't look like a Poker Night Manager backup.");
  }

  return parsed;
}

// Replaces every table's contents with the backup's, atomically -- a
// restore is a full replace, not a merge, so there's no ID-collision or
// conflict-resolution logic to get wrong.
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const players: Player[] = await Promise.all(
    backup.data.players.map(async (player) => ({
      ...player,
      avatar: player.avatar ? await dataUrlToBlob(player.avatar) : undefined,
    })),
  );
  const sessionTemplates = backup.data.sessionTemplates ?? [];
  const blindStructures = backup.data.blindStructures ?? [];

  await db.transaction(
    "rw",
    [
      db.settings,
      db.players,
      db.sessions,
      db.sessionEvents,
      db.chipSets,
      db.sessionTemplates,
      db.blindStructures,
    ],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.players.clear(),
        db.sessions.clear(),
        db.sessionEvents.clear(),
        db.chipSets.clear(),
        db.sessionTemplates.clear(),
        db.blindStructures.clear(),
      ]);
      await Promise.all([
        db.settings.bulkAdd(backup.data.settings),
        db.players.bulkAdd(players),
        db.sessions.bulkAdd(backup.data.sessions),
        db.sessionEvents.bulkAdd(backup.data.sessionEvents),
        db.chipSets.bulkAdd(backup.data.chipSets),
        db.sessionTemplates.bulkAdd(sessionTemplates),
        db.blindStructures.bulkAdd(blindStructures),
      ]);
    },
  );
}
