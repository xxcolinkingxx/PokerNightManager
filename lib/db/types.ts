export interface AppSettings {
  id: "default";
  hostName: string;
  defaultLocation: string;
  hapticsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  settings: AppSettings;
}
