// The help screen (press ? anywhere).

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";

const KEYS: [string, string][] = [
  ["1-7", "jump to Home, Notes, Topic, Week, Reading, History, Settings"],
  ["↑ ↓", "move up and down"],
  ["⏎ or →", "open or choose"],
  ["esc or ←", "go back (← in lists)"],
  ["tab", "next field on a note page"],
  ["?", "this help"],
];

const NOTE_KEYS: [string, string][] = [
  ["n", "new note (Home, Notes)"],
  ["/", "search notes"],
  ["f", "filter in progress / finished"],
  ["⏎ on a scripture", "open it in the New World Translation"],
  ["⇧↑ ⇧↓", "reorder scriptures or weekly templates"],
  ["del / d", "remove the selected item"],
];

const OTHER_KEYS: [string, string][] = [
  ["space", "check off a task, mark a chapter, or another topic"],
  ["e", "add details to a weekly task"],
  ["a", "add a task, topic or template"],
  ["t", "weekly templates (Week)"],
  ["← →", "previous / next week (Week)"],
  ["o", "open a chapter in the NWT (Reading)"],
];

export function helpScreen(app: App): Screen {
  const table = (rows: [string, string][]) =>
    h(
      "div",
      { class: "keys" },
      rows.map(([k, v]) => h("div", { class: "key-row" }, h("kbd", {}, k), h("span", {}, v))),
    );
  return {
    section: app.screen.section,
    title: "help",
    hints: () => [],
    render: () =>
      h(
        "div",
        { class: "columns" },
        panel("getting around", table(KEYS), h("p", { class: "dim small" }, "The mouse works too, but you never need it.")),
        h("div", {}, panel("notes", table(NOTE_KEYS)), panel("everything else", table(OTHER_KEYS))),
      ),
    onKey: (e) => {
      if (e.key === "?" || e.key === "ArrowLeft") {
        app.pop();
        return true;
      }
      return false;
    },
  };
}
