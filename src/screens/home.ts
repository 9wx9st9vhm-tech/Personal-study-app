// Home: a greeting, a quick look at today, and a menu to everything else.

import type { App, Screen, Section } from "../app";
import { bar, h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { dailyReference } from "../topics";
import { parseScriptures } from "../scripture";
import { currentWeekStart, findWeek, progress } from "../week";
import { TOTAL_CHAPTERS } from "../data/bible";
import { openNewProject, openProject } from "./editor";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface MenuItem {
  label: string;
  note: string;
  run: () => void;
}

export function homeScreen(app: App): Screen {
  const nav = new ListNav();

  const menu = (): MenuItem[] => {
    const d = app.data;
    const last = d.projects.find((p) => p.id === d.lastProjectId);
    const go = (s: Section) => () => app.goSection(s);
    const items: MenuItem[] = [];
    if (last) items.push({ label: "Continue studying", note: last.title, run: () => openProject(app, last.id) });
    items.push(
      { label: "New study note", note: "start a fresh page", run: () => void openNewProject(app) },
      { label: "Give me a topic", note: "random subject", run: go("topic") },
      { label: "This week", note: "meetings & tasks", run: go("week") },
      { label: "All notes", note: `${d.projects.length} saved`, run: go("notes") },
      { label: "Bible reading", note: "chapter tracker", run: go("reading") },
      { label: "History", note: "habit & sessions", run: go("history") },
      { label: "Settings", note: "theme, week, backup", run: go("settings") },
    );
    return items;
  };

  return {
    section: "home",
    title: "home",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "⏎", label: "open" },
      { key: "n", label: "new note" },
      { key: "1-7", label: "jump" },
    ],
    render() {
      const d = app.data;
      const items = menu();
      nav.clamp(items.length);

      const week = findWeek(d, currentWeekStart(d, app.today));
      const wk = progress(week);
      const read = Object.keys(d.reading).length;
      const daily = dailyReference(app.today);
      const dailyRef = parseScriptures(daily);
      const studiedToday = d.habitDays.includes(app.today);

      const today = panel(
        "today",
        h("div", { class: "stat" }, h("span", { class: "label" }, "habit "), studiedToday ? h("span", { class: "ok" }, "● checked off") : h("span", { class: "dim" }, "○ open a note page to check off today")),
        h("div", { class: "stat" }, h("span", { class: "label" }, "week  "), bar(wk.done, wk.total, 14), ` ${wk.done}/${wk.total}`),
        h("div", { class: "stat" }, h("span", { class: "label" }, "bible "), bar(read, TOTAL_CHAPTERS, 14), ` ${read}/${TOTAL_CHAPTERS} chapters`),
        h(
          "div",
          { class: "stat" },
          h("span", { class: "label" }, "look up "),
          h(
            "button",
            {
              class: "link",
              tabindex: -1,
              onClick: () => dailyRef.ok && void app.openRef(dailyRef.refs[0]),
            },
            daily,
          ),
          h("span", { class: "dim" }, "  (press r)"),
        ),
      );

      return h(
        "div",
        { class: "home" },
        h(
          "div",
          { class: "hello" },
          h("pre", { class: "logo", "aria-hidden": "true" }, LOGO),
          h("p", { class: "greet" }, `${greeting()}. `, h("span", { class: "dim" }, "What will you study today?"), h("span", { class: "blink" }, "▌")),
        ),
        h(
          "div",
          { class: "columns" },
          panel(
            "menu",
            listRows(
              items,
              nav,
              (item) => [h("span", { class: "grow" }, item.label), h("span", { class: "dim" }, item.note)],
              (i) => items[i].run(),
            ),
          ),
          today,
        ),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const items = menu();
      if (nav.handle(e, items.length)) {
        app.render();
        return true;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        items[nav.index].run();
        return true;
      }
      if (e.key === "n") {
        void openNewProject(app);
        return true;
      }
      if (e.key === "r") {
        const r = parseScriptures(dailyReference(app.today));
        if (r.ok) void app.openRef(r.refs[0]);
        return true;
      }
      return false;
    },
  };
}

// Drawn with the "ANSI Shadow" font from figlet.
const LOGO = `
██████╗ ███████╗██████╗ ███████╗ ██████╗ ███╗   ██╗ █████╗ ██╗         ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗
██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗████╗  ██║██╔══██╗██║         ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝
██████╔╝█████╗  ██████╔╝███████╗██║   ██║██╔██╗ ██║███████║██║         ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝
██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║   ██║██║╚██╗██║██╔══██║██║         ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝
██║     ███████╗██║  ██║███████║╚██████╔╝██║ ╚████║██║  ██║███████╗    ███████║   ██║   ╚██████╔╝██████╔╝   ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝
`.slice(1, -1);
