export interface AppSettings {
  id: "default";
  hostName: string;
  defaultLocation: string;
  hapticsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type { Player, Session, SessionEvent } from "@/lib/session/types";

export interface DatabaseSchema {
  settings: AppSettings;
  players: import("@/lib/session/types").Player;
  sessions: import("@/lib/session/types").Session;
  sessionEvents: import("@/lib/session/types").SessionEvent;
}
