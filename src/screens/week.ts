// This week's to-do list, and the recurring templates that fill it.

import type { App, Screen } from "../app";
import { bar, h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { addDays, shortDate } from "../dates";
import { currentWeekStart, findWeek, progress } from "../week";
import { type TodoItem, newId } from "../model";

const CHEERS = ["Nice.", "Done.", "Good work.", "One more down.", "Keep going."];

export function weekScreen(app: App): Screen {
  const nav = new ListNav();
  let offset = 0; // 0 = this week, -1 = last week...

  const weekStart = () => addDays(currentWeekStart(app.data, app.today), offset * 7);
  const week = () => findWeek(app.data, weekStart());

  const toggle = (item: TodoItem) => {
    app.update(() => (item.done = !item.done));
    const p = progress(week());
    if (item.done) {
      app.flash(p.done === p.total ? "Everything done this week. Well done!" : `${CHEERS[p.done % CHEERS.length]} ${p.done} of ${p.total}.`);
    }
  };

  const editDetail = async (item: TodoItem) => {
    const detail = await app.prompt(`Details for "${item.title}"`, item.detail, "e.g. Isaiah 1-3, or the article title");
    if (detail === null) return;
    app.update(() => (item.detail = detail));
  };

  const addTask = async () => {
    const w = week();
    if (!w) return;
    const title = await app.prompt("Add a task for this week only");
    if (!title) return;
    app.update(() => w.items.push({ id: newId(), title, detail: "", done: false }));
    nav.index = w.items.length - 1;
    app.render();
  };

  const remove = async (item: TodoItem) => {
    const w = week();
    if (!w) return;
    if (!(await app.confirm(`Remove "${item.title}" from this week?`, "Remove", "Keep"))) return;
    app.update(() => (w.items = w.items.filter((i) => i.id !== item.id)));
  };

  return {
    section: "week",
    title: "week",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "space", label: "check" },
      { key: "e", label: "details" },
      { key: "a", label: "add task" },
      { key: "d", label: "remove" },
      { key: "←→", label: "other weeks" },
      { key: "t", label: "templates" },
    ],
    render() {
      const start = weekStart();
      const w = week();
      const items = w?.items ?? [];
      nav.clamp(items.length);
      const p = progress(w);
      const label = offset === 0 ? "this week" : offset === -1 ? "last week" : offset === 1 ? "next week" : offset < 0 ? `${-offset} weeks ago` : `in ${offset} weeks`;
      return h(
        "div",
        { class: "week" },
        h(
          "div",
          { class: "week-head" },
          h("span", { class: "accent" }, `◂ ${label} ▸`),
          h("span", { class: "dim" }, `  ${shortDate(start)} – ${shortDate(addDays(start, 6))}`),
          h("span", { class: "grow" }),
          bar(p.done, p.total, 24),
          ` ${p.done}/${p.total}`,
        ),
        panel(
          "to do",
          !w
            ? h("p", { class: "dim empty" }, offset > 0 ? "This week's list appears when the week begins." : "No list was made for this week.")
            : items.length === 0
              ? h("p", { class: "dim empty" }, "Nothing here. Press a to add a task, or t to set up your weekly templates.")
              : listRows(
                  items,
                  nav,
                  (i) => [
                    h("span", { class: i.done ? "ok check" : "check" }, i.done ? "[x]" : "[ ]"),
                    h(
                      "span",
                      { class: `grow${i.done ? " dim strike" : ""}` },
                      i.title,
                      i.detail ? h("span", { class: "detail" }, ` — ${i.detail}`) : null,
                    ),
                    i.carriedFrom ? h("span", { class: "warn small" }, "from last week") : null,
                    !i.templateId && !i.carriedFrom ? h("span", { class: "dim small" }, "one-off") : null,
                  ],
                  (idx) => toggle(items[idx]),
                ),
        ),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const items = week()?.items ?? [];
      if (nav.handle(e, items.length)) {
        app.render();
        return true;
      }
      const item = items[nav.index];
      switch (e.key) {
        case " ":
        case "Enter":
        case "x":
          if (item) toggle(item);
          return true;
        case "e":
          if (item) void editDetail(item);
          return true;
        case "a":
        case "n":
          void addTask();
          return true;
        case "d":
        case "Delete":
          if (item) void remove(item);
          return true;
        case "ArrowLeft":
          offset--;
          nav.index = 0;
          app.render();
          return true;
        case "ArrowRight":
          if (offset < 1) offset++;
          nav.index = 0;
          app.render();
          return true;
        case "t":
          app.push(templatesScreen(app));
          return true;
        case "0":
          offset = 0;
          app.render();
          return true;
      }
      return false;
    },
  };
}

export function templatesScreen(app: App): Screen {
  const nav = new ListNav();
  const list = () => app.data.templates;

  const add = async () => {
    const title = await app.prompt("New weekly task", "", "e.g. Prepare field service presentation");
    if (!title) return;
    const id = newId();
    app.update((d) => {
      d.templates.push({ id, title, enabled: true });
      // Also add it to the current week so you don't wait until next week.
      const w = findWeek(d, currentWeekStart(d, app.today));
      w?.items.push({ id: newId(), title, detail: "", done: false, templateId: id });
    });
    nav.index = list().length - 1;
    app.render();
    app.flash(`"${title}" will appear every week, starting now.`);
  };

  const rename = async (i: number) => {
    const t = list()[i];
    const title = await app.prompt("Rename weekly task", t.title);
    if (!title) return;
    app.update(() => (t.title = title));
  };

  const remove = async (i: number) => {
    const t = list()[i];
    if (!(await app.confirm(`Stop adding "${t.title}" each week?`, "Remove", "Keep"))) return;
    app.update((d) => d.templates.splice(i, 1));
  };

  const reorder = (i: number, delta: number) => {
    const to = i + delta;
    if (to < 0 || to >= list().length) return;
    app.update((d) => {
      const [t] = d.templates.splice(i, 1);
      d.templates.splice(to, 0, t);
    });
    nav.index = to;
    app.render();
  };

  return {
    section: "week",
    title: "weekly templates",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "space", label: "on/off" },
      { key: "⏎", label: "rename" },
      { key: "a", label: "add" },
      { key: "⇧↑↓", label: "reorder" },
      { key: "d", label: "remove" },
    ],
    render() {
      nav.clamp(list().length);
      return h(
        "div",
        {},
        panel(
          "every week",
          list().length === 0
            ? h("p", { class: "dim empty" }, "No weekly tasks. Press a to add one.")
            : listRows(
                list(),
                nav,
                (t) => [
                  h("span", { class: t.enabled ? "ok check" : "check dim" }, t.enabled ? "[on] " : "[off]"),
                  h("span", { class: `grow${t.enabled ? "" : " dim"}` }, t.title),
                ],
                (i) => void rename(i),
              ),
        ),
        h(
          "p",
          { class: "dim small" },
          `A fresh list is made from these at the start of each week (${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][app.data.settings.weekStart]}s). Change the start day in Settings.`,
        ),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      if ((e.shiftKey || e.altKey) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        reorder(nav.index, e.key === "ArrowUp" ? -1 : 1);
        return true;
      }
      if (nav.handle(e, list().length)) {
        app.render();
        return true;
      }
      const t = list()[nav.index];
      switch (e.key) {
        case " ":
          if (t) app.update(() => (t.enabled = !t.enabled));
          return true;
        case "Enter":
          if (t) void rename(nav.index);
          return true;
        case "a":
        case "n":
          void add();
          return true;
        case "d":
        case "Delete":
          if (t) void remove(nav.index);
          return true;
        case "ArrowLeft":
          app.pop();
          return true;
      }
      return false;
    },
  };
}
