// History: the habit tracker (which days you studied) and a log of sessions.

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { WEEKDAYS, addDays, parseDay, relativeDay, weekStartOf } from "../dates";
import { openProject } from "./editor";

const WEEKS_SHOWN = 20;

export function historyScreen(app: App): Screen {
  const nav = new ListNav();

  const sessions = () =>
    [...app.data.sessions].sort((a, b) => b.at.localeCompare(a.at)).map((s) => ({
      ...s,
      project: app.data.projects.find((p) => p.id === s.projectId),
    }));

  return {
    section: "history",
    title: "history",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "⏎", label: "open note" },
    ],
    render() {
      const days = new Set(app.data.habitDays);
      const weekStart = app.data.settings.weekStart;
      const firstWeek = addDays(weekStartOf(app.today, weekStart), -7 * (WEEKS_SHOWN - 1));

      // A grid: one column per week, one row per weekday.
      const rows = Array.from({ length: 7 }, (_, r) =>
        h(
          "div",
          { class: "habit-row" },
          h("span", { class: "dim day-label" }, WEEKDAYS[(weekStart + r) % 7].slice(0, 3)),
          Array.from({ length: WEEKS_SHOWN }, (_, w) => {
            const day = addDays(firstWeek, w * 7 + r);
            const future = day > app.today;
            const on = days.has(day);
            return h(
              "span",
              { class: `cell${on ? " on" : ""}${day === app.today ? " now" : ""}${future ? " future" : ""}`, title: day },
              future ? " " : on ? "■" : "·",
            );
          }),
        ),
      );

      const month = app.today.slice(0, 7);
      const thisMonth = app.data.habitDays.filter((d) => d.startsWith(month)).length;
      const daysInMonth = parseDay(app.today).getDate();
      const last7 = Array.from({ length: 7 }, (_, i) => addDays(app.today, -i)).filter((d) => days.has(d)).length;

      const list = sessions();
      nav.clamp(list.length);

      return h(
        "div",
        { class: "history" },
        panel(
          "habit tracker",
          h("div", { class: "habit-grid" }, rows),
          h(
            "p",
            { class: "small legend" },
            h("span", {}, h("span", { class: "ok" }, "■"), " studied"),
            h("span", {}, h("span", { class: "dim" }, "·"), " no session"),
            h("span", { class: "accent" }, `this month ${thisMonth}/${daysInMonth} days`),
            h("span", {}, `last 7 days ${last7}`),
            h("span", {}, `all time ${app.data.habitDays.length} day${app.data.habitDays.length === 1 ? "" : "s"}`),
          ),
          h("p", { class: "dim small" }, "A day is checked off when you open a note page."),
        ),
        panel(
          `sessions (${list.length})`,
          list.length === 0
            ? h("p", { class: "dim empty" }, "No sessions yet. They appear here when you open a note page.")
            : listRows(
                list,
                nav,
                (s) => [
                  h("span", { class: "dim when-col" }, relativeDay(s.day, app.today)),
                  h("span", { class: `grow${s.project ? "" : " dim"}` }, s.project?.title ?? "(deleted note)"),
                ],
                (i) => list[i].project && openProject(app, list[i].project!.id),
              ),
        ),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const list = sessions();
      if (nav.handle(e, list.length)) {
        app.render();
        return true;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        const p = list[nav.index]?.project;
        if (p) openProject(app, p.id);
        return true;
      }
      if (e.key === "ArrowLeft") return app.pop(), true;
      return false;
    },
  };
}
