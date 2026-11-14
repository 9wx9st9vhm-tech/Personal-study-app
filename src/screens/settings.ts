// Settings: look, week, topics, links, AI (later) and backups.

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { WEEKDAYS } from "../dates";
import { type ThemeName, normalizeData } from "../model";
import { PLANNED_PROVIDERS } from "../ai";
import { BUILT_IN_TOPICS } from "../topics";
import { storage } from "../storage";

interface Setting {
  label: string;
  value: () => string;
  /** ← → or Enter. dir is -1 or +1. */
  change: (dir: number) => void | Promise<void>;
  note?: string;
}

const THEMES: { id: ThemeName; label: string }[] = [
  { id: "amber", label: "amber" },
  { id: "phosphor", label: "green phosphor" },
  { id: "ice", label: "ice blue" },
  { id: "paper", label: "paper (light)" },
];
const RECENT = [7, 14, 30, 60, 90];

function cycle<T>(list: T[], current: T, dir: number): T {
  const i = list.indexOf(current);
  return list[(i + dir + list.length) % list.length];
}

export function settingsScreen(app: App): Screen {
  const nav = new ListNav();
  let location = "";
  void storage.location().then((l) => {
    location = l;
    app.render();
  });

  const set = (change: () => void) => {
    app.update(change);
    app.applyTheme();
  };

  const s = () => app.data.settings;

  const exportBackup = async () => {
    await app.flush();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    try {
      const path = await storage.exportBackup(JSON.stringify(app.data, null, 2), stamp);
      app.flash(`Backup saved: ${path}`);
    } catch (err) {
      console.error(err);
      app.flash("Couldn't write the backup.");
    }
  };

  const restore = async () => {
    const files = await storage.listBackups();
    if (files.length === 0) {
      app.flash("No backups found yet.");
      return;
    }
    const i = await app.choose("Restore which backup? Your current data is backed up first.", files.map((f) => f.name));
    if (i === null) return;
    const ok = await app.confirm(`Replace everything with ${files[i].name}?`, "Restore", "Cancel");
    if (!ok) return;
    try {
      const text = await storage.readBackup(files[i].path);
      const data = normalizeData(JSON.parse(text), BUILT_IN_TOPICS);
      await exportBackup(); // safety copy of what you have now
      app.update((d) => Object.assign(d, data));
      app.applyTheme();
      app.flash(`Restored ${files[i].name}.`);
    } catch (err) {
      console.error(err);
      app.flash("That backup couldn't be read. Nothing was changed.");
    }
  };

  const items: Setting[] = [
    {
      label: "Theme",
      value: () => THEMES.find((t) => t.id === s().theme)!.label,
      change: (dir) => set(() => (s().theme = cycle(THEMES.map((t) => t.id), s().theme, dir))),
    },
    {
      label: "Scanlines",
      value: () => (s().scanlines ? "on" : "off"),
      change: () => set(() => (s().scanlines = !s().scanlines)),
      note: "faint CRT lines over the screen",
    },
    {
      label: "Start-up animation",
      value: () => (s().bootAnimation ? "on" : "off"),
      change: () => set(() => (s().bootAnimation = !s().bootAnimation)),
    },
    {
      label: "Week starts on",
      value: () => WEEKDAYS[s().weekStart],
      change: (dir) => set(() => (s().weekStart = (s().weekStart + dir + 7) % 7)),
      note: "takes effect from the next new week",
    },
    {
      label: "Carry over unfinished tasks",
      value: () => (s().carryOver ? "yes" : "no"),
      change: () => set(() => (s().carryOver = !s().carryOver)),
    },
    {
      label: "Topic counts as recent for",
      value: () => `${s().recentDays} days`,
      change: (dir) => set(() => (s().recentDays = cycle(RECENT, s().recentDays, dir))),
      note: "the random button skips these",
    },
    {
      label: "Scripture links open in",
      value: () => (s().linkTarget === "web" ? "jw.org (browser)" : "JW Library app"),
      change: () => set(() => (s().linkTarget = s().linkTarget === "web" ? "app" : "web")),
      note: "JW Library must be installed on this Mac",
    },
    {
      label: "AI assistant",
      value: () => "off",
      change: () => app.flash(`Coming later: ${PLANNED_PROVIDERS.map((p) => p.label).join(" / ")}`),
      note: "not part of version 1",
    },
    { label: "Export a backup now", value: () => "", change: exportBackup, note: "saved to Documents/Personal Study Backups" },
    { label: "Restore from a backup", value: () => "", change: restore },
  ];

  return {
    section: "settings",
    title: "settings",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "←→/⏎", label: "change" },
    ],
    render() {
      return h(
        "div",
        {},
        panel(
          "settings",
          listRows(
            items,
            nav,
            (it) => [
              h("span", { class: "grow" }, it.label),
              it.value() ? h("span", { class: "accent value" }, `‹ ${it.value()} ›`) : h("span", { class: "accent value" }, "⏎"),
              h("span", { class: "dim note" }, it.note ?? ""),
            ],
            (i) => void items[i].change(1),
            "settings",
          ),
        ),
        h("p", { class: "dim small" }, `Your data: ${location}`),
        h("p", { class: "dim small" }, "Everything stays on this Mac. A copy is also kept automatically each day in the backups folder next to your data."),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      if (nav.handle(e, items.length)) {
        app.render();
        return true;
      }
      const it = items[nav.index];
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") return void it.change(1), true;
      if (e.key === "ArrowLeft") return void it.change(-1), true;
      return false;
    },
  };
}
