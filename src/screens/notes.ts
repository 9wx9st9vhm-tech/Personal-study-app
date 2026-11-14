// All study notes, with search and a filter for in-progress / finished.

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { formatRef } from "../scripture";
import { relativeDay } from "../dates";
import type { Project } from "../model";
import { openNewProject, openProject } from "./editor";

const FILTERS = ["all", "in progress", "finished"] as const;

export function notesScreen(app: App): Screen {
  const nav = new ListNav();
  let query = "";
  let searching = false;
  let filter = 0;

  const visible = (): Project[] => {
    const q = query.trim().toLowerCase();
    return app.data.projects
      .filter((p) => FILTERS[filter] === "all" || (FILTERS[filter] === "finished") === (p.status === "finished"))
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q) ||
          p.scriptures.some((r) => formatRef(r).toLowerCase().includes(q)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  };

  const remove = async (p: Project) => {
    if (!(await app.confirm(`Delete "${p.title}"? This can't be undone.`, "Delete", "Keep it"))) return;
    app.update((d) => {
      d.projects = d.projects.filter((x) => x.id !== p.id);
      if (d.lastProjectId === p.id) d.lastProjectId = undefined;
    });
    app.flash("Deleted.");
  };

  return {
    section: "notes",
    title: "notes",
    hints: () =>
      searching
        ? [{ key: "type", label: "search" }, { key: "⏎/↓", label: "to results" }, { key: "esc", label: "clear" }]
        : [
            { key: "↑↓", label: "move" },
            { key: "⏎", label: "open" },
            { key: "n", label: "new" },
            { key: "/", label: "search" },
            { key: "f", label: `filter: ${FILTERS[filter]}` },
            { key: "d", label: "delete" },
          ],
    render() {
      const list = visible();
      nav.clamp(list.length);
      const search = h(
        "div",
        { class: `stop search${searching ? " focused" : ""}`, onClick: () => ((searching = true), app.render()) },
        h("span", { class: "prompt-sign" }, "/"),
        h("input", {
          class: "field",
          value: query,
          placeholder: "search titles, scriptures and notes",
          spellcheck: false,
          onInput: (e: Event) => {
            query = (e.target as HTMLInputElement).value;
            nav.index = 0;
            app.render();
          },
        }),
      );
      const empty =
        app.data.projects.length === 0
          ? h("p", { class: "dim empty" }, "No notes yet. Press n to start one, or press 3 for a random topic.")
          : h("p", { class: "dim empty" }, "Nothing matches.");
      return h(
        "div",
        {},
        search,
        panel(
          `${FILTERS[filter]} · ${list.length} of ${app.data.projects.length}`,
          list.length === 0
            ? empty
            : listRows(
                list,
                nav,
                (p) => [
                  h("span", { class: p.status === "finished" ? "ok mark" : "accent mark" }, p.status === "finished" ? "✓" : "•"),
                  h("span", { class: "grow" }, p.title),
                  h("span", { class: "dim" }, p.scriptures.length ? `${p.scriptures.length} scr` : ""),
                  h("span", { class: "dim when" }, relativeDay(toLocalDay(p.updatedAt))),
                ],
                (i) => openProject(app, list[i].id),
              ),
        ),
      );
    },
    mounted(root) {
      scrollSelected(root);
      if (searching) {
        const input = root.querySelector<HTMLInputElement>(".search input")!;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    },
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const list = visible();
      if (searching) {
        if (e.key === "Escape") {
          searching = false;
          query = "";
          app.render();
          return true;
        }
        if (e.key === "Enter" || e.key === "ArrowDown") {
          searching = false;
          (document.activeElement as HTMLElement | null)?.blur();
          app.render();
          return true;
        }
        return false;
      }
      if (nav.handle(e, list.length)) {
        app.render();
        return true;
      }
      switch (e.key) {
        case "Enter":
        case "ArrowRight":
          if (list[nav.index]) openProject(app, list[nav.index].id);
          return true;
        case "n":
          void openNewProject(app);
          return true;
        case "/":
          searching = true;
          app.render();
          return true;
        case "f":
          filter = (filter + 1) % FILTERS.length;
          nav.index = 0;
          app.render();
          return true;
        case "d":
        case "Delete":
          if (list[nav.index]) void remove(list[nav.index]);
          return true;
        case "ArrowLeft":
          app.pop();
          return true;
      }
      return false;
    },
  };
}

/** "2026-11-14T18:00:00Z" -> the local day it happened on. */
function toLocalDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
