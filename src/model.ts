// The shape of everything the app saves. All of it lives in one file on your
// Mac (see storage.ts), so a backup is just a copy of that file.

import type { Day } from "./dates";
import type { LinkTarget, ScriptureRef } from "./scripture";

export interface Project {
  id: string;
  title: string;
  /** Set when the project was started from a random topic. */
  topicId?: string;
  scriptures: ScriptureRef[];
  notes: string;
  status: "active" | "finished";
  createdAt: Day;
  updatedAt: string; // ISO timestamp
}

export interface Topic {
  id: string;
  title: string;
  /** A question to start thinking with. */
  question: string;
  /** Places to start reading. Copied into a project when you start it. */
  starters: ScriptureRef[];
  builtIn: boolean;
  /** Hidden topics are never suggested. */
  hidden: boolean;
}

/** Every time the random button shows a topic. */
export interface TopicPick {
  topicId: string;
  at: string; // ISO timestamp
  started: boolean;
}

export interface TodoTemplate {
  id: string;
  title: string;
  enabled: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  /** e.g. chapters or the article title for this week. */
  detail: string;
  done: boolean;
  templateId?: string;
  /** The week this was carried over from, if it was unfinished last week. */
  carriedFrom?: Day;
}

export interface WeekList {
  weekStart: Day;
  items: TodoItem[];
}

/** One study session: opening a note page on a given day. */
export interface Session {
  id: string;
  day: Day;
  projectId: string;
  at: string; // ISO timestamp of the first open that day
}

export type ThemeName = "white" | "amber" | "phosphor" | "ice" | "paper";
export type AIProvider = "off" | "claude" | "local";

export interface Settings {
  theme: ThemeName;
  bootAnimation: boolean;
  scanlines: boolean;
  /** Topics studied within this many days are skipped by the random button. */
  recentDays: number;
  /** 0 = Sunday ... 6 = Saturday. */
  weekStart: number;
  carryOver: boolean;
  linkTarget: LinkTarget;
  /** Reserved for the AI plug-in. Always "off" in version 1. */
  aiProvider: AIProvider;
  /** Bumped when the default look changes, so existing installs switch once. */
  lookVersion?: number;
}

export interface AppData {
  version: 1;
  projects: Project[];
  topics: Topic[];
  topicPicks: TopicPick[];
  templates: TodoTemplate[];
  weeks: WeekList[];
  sessions: Session[];
  /** Days the habit tracker checked off. */
  habitDays: Day[];
  /** "book:chapter" -> the day it was marked read, e.g. "43:3" -> "2026-11-14". */
  reading: Record<string, Day>;
  settings: Settings;
  /** The last project you had open, for "Continue". */
  lastProjectId?: string;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "white",
  bootAnimation: true,
  scanlines: true,
  recentDays: 30,
  weekStart: 1, // Monday
  carryOver: true,
  linkTarget: "web",
  aiProvider: "off",
  lookVersion: 2,
};

export const DEFAULT_TEMPLATES: string[] = [
  "Midweek meeting preparation",
  "Watchtower Study preparation",
  "Weekly Bible reading",
  "Personal study session",
];

export function emptyData(builtInTopics: Topic[]): AppData {
  return {
    version: 1,
    projects: [],
    topics: builtInTopics.map((t) => ({ ...t })),
    topicPicks: [],
    templates: DEFAULT_TEMPLATES.map((title) => ({ id: newId(), title, enabled: true })),
    weeks: [],
    sessions: [],
    habitDays: [],
    reading: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * Make loaded data safe to use: fill anything missing with defaults and add
 * built-in topics that are new in this version of the app.
 */
export function normalizeData(raw: unknown, builtInTopics: Topic[]): AppData {
  const base = emptyData(builtInTopics);
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<AppData>;
  const data: AppData = {
    version: 1,
    projects: Array.isArray(d.projects) ? d.projects : [],
    topics: Array.isArray(d.topics) ? d.topics : base.topics,
    topicPicks: Array.isArray(d.topicPicks) ? d.topicPicks : [],
    templates: Array.isArray(d.templates) ? d.templates : base.templates,
    weeks: Array.isArray(d.weeks) ? d.weeks : [],
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    habitDays: Array.isArray(d.habitDays) ? d.habitDays : [],
    reading: d.reading && typeof d.reading === "object" ? d.reading : {},
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
    lastProjectId: d.lastProjectId,
  };
  // Version 2 made white the default; switch existing installs over once.
  if (d.settings && (d.settings.lookVersion ?? 1) < 2) {
    data.settings.theme = "white";
    data.settings.lookVersion = 2;
  }
  const known = new Set(data.topics.map((t) => t.id));
  for (const t of builtInTopics) if (!known.has(t.id)) data.topics.push({ ...t });
  return data;
}
