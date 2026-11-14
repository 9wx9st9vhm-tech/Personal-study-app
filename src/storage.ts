// Saving and loading. Inside the Mac app, the Rust side (src-tauri/src/lib.rs)
// writes your data to a file in the app's data folder and keeps daily
// backups. When the interface runs in a plain browser (for development and
// tests) it uses the browser's localStorage instead.

import { invoke } from "@tauri-apps/api/core";

const inApp = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const KEY = "personal-study-data";

export interface BackupFile {
  name: string;
  path: string;
}

export const storage = {
  inApp,

  async load(): Promise<string | null> {
    if (inApp) return invoke<string | null>("load_data");
    return localStorage.getItem(KEY);
  },

  async save(json: string, day: string): Promise<void> {
    if (inApp) return invoke("save_data", { json, day });
    localStorage.setItem(KEY, json);
  },

  /** Where the data lives, shown in Settings. */
  async location(): Promise<string> {
    if (inApp) return invoke<string>("data_location");
    return "Browser storage (development mode)";
  },

  /** Write a copy to Documents/Personal Study Backups. Returns its path. */
  async exportBackup(json: string, stamp: string): Promise<string> {
    if (inApp) return invoke<string>("export_backup", { json, stamp });
    localStorage.setItem(`${KEY}-backup-${stamp}`, json);
    return `browser backup ${stamp}`;
  },

  async listBackups(): Promise<BackupFile[]> {
    if (inApp) return invoke<BackupFile[]>("list_backups");
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(`${KEY}-backup-`))
      .sort()
      .reverse()
      .map((k) => ({ name: k.replace(`${KEY}-backup-`, "backup-"), path: k }));
  },

  async readBackup(path: string): Promise<string> {
    if (inApp) return invoke<string>("read_backup", { path });
    return localStorage.getItem(path) ?? "";
  },

  async openUrl(url: string): Promise<void> {
    if (inApp) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      return openUrl(url);
    }
    window.open(url, "_blank", "noopener");
  },
};
