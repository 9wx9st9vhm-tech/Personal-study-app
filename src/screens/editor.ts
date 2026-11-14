// A note page: the project title, related scriptures, and your notes.
// Every part is a "stop" you move between with ↑ ↓ (or Tab). Text boxes take
// typing directly; everything saves as you go.

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";
import { type Project, newId } from "../model";
import { type ScriptureRef, formatRef, parseScriptures } from "../scripture";
import { longDate, today } from "../dates";
import { getAssistant } from "../ai";

type Stop =
  | { kind: "title" }
  | { kind: "status" }
  | { kind: "add" }
  | { kind: "ref"; index: number }
  | { kind: "notes" }
  | { kind: "delete" };

/** Open an existing project and count it as studying today. */
export function openProject(app: App, id: string): void {
  if (!app.data.projects.some((p) => p.id === id)) return;
  app.recordStudy(id);
  app.push(editorScreen(app, id));
}

/** Ask for a title, create the project, and open it. */
export async function openNewProject(
  app: App,
  start: { title?: string; topicId?: string; scriptures?: ScriptureRef[]; notes?: string } = {},
): Promise<void> {
  const title = start.title ?? (await app.prompt("Title for this study", "", "e.g. How to deal with anxiety"));
  if (!title) return;
  const project: Project = {
    id: newId(),
    title,
    topicId: start.topicId,
    scriptures: start.scriptures ? start.scriptures.map((r) => ({ ...r, verses: r.verses.map((v) => ({ ...v })) })) : [],
    notes: start.notes ?? "",
    status: "active",
    createdAt: today(),
    updatedAt: new Date().toISOString(),
  };
  app.update((d) => d.projects.unshift(project), { render: false });
  app.recordStudy(project.id);
  app.push(editorScreen(app, project.id, { kind: "add" }));
  app.flash("New study started. Add scriptures, then write your notes.");
}

export function editorScreen(app: App, projectId: string, firstStop: Stop = { kind: "notes" }): Screen {
  const project = () => app.data.projects.find((p) => p.id === projectId)!;
  let addText = "";
  let addError = "";
  let notesCaret: number | null = null;

  const stops = (): Stop[] => [
    { kind: "title" },
    { kind: "status" },
    { kind: "add" },
    ...project().scriptures.map((_, index) => ({ kind: "ref" as const, index })),
    { kind: "notes" },
    { kind: "delete" },
  ];
  const sameStop = (a: Stop, b: Stop) => a.kind === b.kind && (a.kind !== "ref" || a.index === (b as { index: number }).index);
  let at = Math.max(0, stops().findIndex((s) => sameStop(s, firstStop)));
  const current = () => stops()[at];

  const touch = (change: (p: Project) => void, render = false) =>
    app.update(
      () => {
        const p = project();
        change(p);
        p.updatedAt = new Date().toISOString();
      },
      { render },
    );

  const move = (delta: number) => {
    const n = stops().length;
    at = Math.max(0, Math.min(n - 1, at + delta));
    app.render();
  };

  const addScriptures = () => {
    const result = parseScriptures(addText);
    if (!result.ok) {
      addError = result.error;
      app.render();
      return;
    }
    touch((p) => p.scriptures.push(...result.refs), false);
    addText = "";
    addError = "";
    app.flash(`Added ${result.refs.map(formatRef).join("; ")}`);
    app.render();
  };

  const removeRef = (index: number) => {
    const removed = formatRef(project().scriptures[index]);
    touch((p) => p.scriptures.splice(index, 1));
    at = Math.min(at, stops().length - 1);
    app.flash(`Removed ${removed}`);
    app.render();
  };

  const moveRef = (index: number, delta: number) => {
    const list = project().scriptures;
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    touch((p) => {
      const [r] = p.scriptures.splice(index, 1);
      p.scriptures.splice(to, 0, r);
    });
    at += delta;
    app.render();
  };

  const toggleStatus = () => {
    touch((p) => (p.status = p.status === "active" ? "finished" : "active"));
    app.flash(project().status === "finished" ? "Marked finished. Well done." : "Back in progress.");
    app.render();
  };

  const deleteProject = async () => {
    const ok = await app.confirm(`Delete "${project().title}"? This can't be undone.`, "Delete", "Keep it");
    if (!ok) return;
    app.update(
      (d) => {
        d.projects = d.projects.filter((p) => p.id !== projectId);
        if (d.lastProjectId === projectId) d.lastProjectId = undefined;
      },
      { render: false },
    );
    app.pop();
    app.flash("Deleted.");
  };

  const isAt = (kind: Stop["kind"], index?: number) => {
    const s = current();
    return s.kind === kind && (index === undefined || (s.kind === "ref" && s.index === index));
  };
  const focusClass = (kind: Stop["kind"], index?: number) => (isAt(kind, index) ? " focused" : "");
  const goTo = (stop: Stop) => {
    at = stops().findIndex((s) => sameStop(s, stop));
    app.render();
  };

  return {
    section: "notes",
    get title() {
      return project()?.title ?? "note";
    },
    hints() {
      const s = current();
      const base = [{ key: "↑↓", label: "move" }];
      switch (s.kind) {
        case "title":
          return [...base, { key: "type", label: "rename" }];
        case "status":
          return [...base, { key: "⏎", label: "toggle finished" }];
        case "add":
          return [...base, { key: "type", label: "e.g. Phil 4:6, 7" }, { key: "⏎", label: "add" }];
        case "ref":
          return [...base, { key: "⏎", label: "open in NWT" }, { key: "⇧↑↓", label: "reorder" }, { key: "del", label: "remove" }];
        case "notes":
          return [...base, { key: "type", label: "write notes" }];
        case "delete":
          return [...base, { key: "⏎", label: "delete project" }];
      }
    },
    render() {
      const p = project();
      if (!p) return h("p", {}, "This note was deleted.");
      at = Math.min(at, stops().length - 1);
      const assistant = getAssistant(app.data.settings.aiProvider);

      const header = h(
        "div",
        { class: "editor-head" },
        h(
          "div",
          { class: `stop title-stop${focusClass("title")}`, onClick: () => goTo({ kind: "title" }) },
          h("span", { class: "label" }, "title "),
          h("input", {
            class: "field title-field",
            value: p.title,
            spellcheck: false,
            "data-stop": "title",
            onInput: (e: Event) => touch((x) => (x.title = (e.target as HTMLInputElement).value)),
            onBlur: () => {
              if (!project().title.trim()) touch((x) => (x.title = "Untitled study"), true);
            },
          }),
        ),
        h(
          "div",
          { class: "meta" },
          h(
            "button",
            {
              class: `stop chip${focusClass("status")} ${p.status === "finished" ? "ok" : "accent"}`,
              tabindex: 0,
              "data-stop": "status",
              onClick: () => {
                goTo({ kind: "status" });
                toggleStatus();
              },
            },
            p.status === "finished" ? "[✓] finished" : "[ ] in progress",
          ),
          h("span", { class: "dim" }, `  started ${longDate(p.createdAt)}`),
        ),
      );

      const scriptures = panel(
        `related scriptures (${p.scriptures.length})`,
        h(
          "div",
          { class: `stop add-stop${focusClass("add")}`, onClick: () => goTo({ kind: "add" }) },
          h("span", { class: "prompt-sign" }, "+"),
          h("input", {
            class: "field",
            value: addText,
            placeholder: "add a scripture, e.g. Philippians 4:6, 7; Psalm 55:22",
            spellcheck: false,
            "data-stop": "add",
            onInput: (e: Event) => {
              addText = (e.target as HTMLInputElement).value;
              if (addError) {
                addError = "";
                const err = document.querySelector(".add-error");
                if (err) err.textContent = "";
              }
            },
          }),
        ),
        h("div", { class: "add-error warn small" }, addError),
        p.scriptures.length === 0
          ? h("p", { class: "dim empty" }, "No scriptures yet. Type one above and press enter.")
          : h(
              "div",
              { class: "list refs" },
              p.scriptures.map((r, i) =>
                h(
                  "div",
                  {
                    class: `row stop${focusClass("ref", i)}${isAt("ref", i) ? " selected" : ""}`,
                    tabindex: 0,
                    "data-stop": `ref-${i}`,
                    onClick: () => {
                      goTo({ kind: "ref", index: i });
                      void app.openRef(r);
                    },
                  },
                  h("span", { class: "cursor" }, isAt("ref", i) ? "▸" : " "),
                  h("span", { class: "grow link-text" }, formatRef(r)),
                  h("span", { class: "dim" }, "↗ NWT"),
                ),
              ),
            ),
      );

      const notes = panel(
        "notes",
        h("textarea", {
          class: `field notes stop${focusClass("notes")}`,
          spellcheck: true,
          placeholder: "Write what you're learning. Questions, thoughts, how it applies to you…",
          "data-stop": "notes",
          value: p.notes,
          onFocus: () => {
            if (!isAt("notes")) at = stops().findIndex((s) => s.kind === "notes");
          },
          onInput: (e: Event) => touch((x) => (x.notes = (e.target as HTMLTextAreaElement).value)),
          onBlur: (e: Event) => (notesCaret = (e.target as HTMLTextAreaElement).selectionStart),
        }),
      );

      const side = panel(
        "assistant",
        h(
          "p",
          { class: "dim small" },
          assistant.ready()
            ? `${assistant.label} is connected.`
            : "Not connected. An AI helper (Claude or a local model) can plug in here later to suggest scriptures or questions. Your notes stay on this Mac.",
        ),
      );

      const danger = h(
        "button",
        {
          class: `stop danger${focusClass("delete")}`,
          tabindex: 0,
          "data-stop": "delete",
          onClick: () => void deleteProject(),
        },
        "[ delete this project ]",
      );

      return h("div", { class: "editor" }, header, h("div", { class: "editor-body" }, h("div", { class: "editor-main" }, scriptures, notes), h("div", { class: "editor-side" }, side, danger)));
    },
    mounted(root) {
      const s = current();
      const key = s.kind === "ref" ? `ref-${s.index}` : s.kind;
      const el = root.querySelector<HTMLElement>(`[data-stop="${key}"]`);
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest" });
      if (el instanceof HTMLTextAreaElement && notesCaret !== null) {
        el.setSelectionRange(notesCaret, notesCaret);
      } else if (el instanceof HTMLInputElement) {
        el.setSelectionRange(el.value.length, el.value.length);
      }
    },
    onKey(e) {
      const s = current();
      if (e.key === "Tab") {
        move(e.shiftKey ? -1 : 1);
        return true;
      }
      if (e.key === "Escape") {
        // Leave the page. Everything is already saved.
        (document.activeElement as HTMLElement | null)?.blur();
        app.pop();
        return true;
      }
      if (s.kind === "notes") {
        const ta = e.target instanceof HTMLTextAreaElement ? e.target : null;
        if (!ta) return false;
        const before = ta.value.slice(0, ta.selectionStart);
        const after = ta.value.slice(ta.selectionEnd);
        if (e.key === "ArrowUp" && !before.includes("\n") && !e.shiftKey) {
          notesCaret = ta.selectionStart;
          move(-1);
          return true;
        }
        if (e.key === "ArrowDown" && !after.includes("\n") && !e.shiftKey) {
          notesCaret = ta.selectionStart;
          move(1);
          return true;
        }
        return false; // normal typing
      }
      if (s.kind === "ref" && (e.shiftKey || e.altKey) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        moveRef(s.index, e.key === "ArrowUp" ? -1 : 1);
        return true;
      }
      if (e.key === "ArrowUp") {
        move(-1);
        return true;
      }
      if (e.key === "ArrowDown") {
        move(1);
        return true;
      }
      switch (s.kind) {
        case "title":
          if (e.key === "Enter") return move(1), true;
          return false;
        case "add":
          if (e.key === "Enter") {
            if (addText.trim()) addScriptures();
            else move(1);
            return true;
          }
          return false;
        case "status":
          if (e.key === "Enter" || e.key === " ") return toggleStatus(), true;
          return false;
        case "ref":
          if (e.key === "Enter" || e.key === "o" || e.key === "ArrowRight") return void app.openRef(project().scriptures[s.index]), true;
          if (e.key === "Delete" || e.key === "Backspace" || e.key === "d") return removeRef(s.index), true;
          return false;
        case "delete":
          if (e.key === "Enter" || e.key === " ") return void deleteProject(), true;
          return false;
      }
    },
  };
}
