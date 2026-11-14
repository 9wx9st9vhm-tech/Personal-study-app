// Arrow-key movement for any list on screen. A screen keeps one ListNav per
// list and asks it to handle the movement keys.

import { h } from "./dom";

export class ListNav {
  index = 0;

  /** Keep the selection inside the list after items are added or removed. */
  clamp(length: number): void {
    this.index = Math.max(0, Math.min(this.index, length - 1));
  }

  /** Handle ↑ ↓ Home End PageUp PageDown. Returns true if the key was used. */
  handle(e: KeyboardEvent, length: number, columns = 1): boolean {
    if (length === 0) return false;
    const before = this.index;
    switch (e.key) {
      case "ArrowUp":
        this.index -= columns;
        break;
      case "ArrowDown":
        this.index += columns;
        break;
      case "ArrowLeft":
        if (columns === 1) return false;
        this.index -= 1;
        break;
      case "ArrowRight":
        if (columns === 1) return false;
        this.index += 1;
        break;
      case "Home":
        this.index = 0;
        break;
      case "End":
        this.index = length - 1;
        break;
      case "PageUp":
        this.index -= 10 * columns;
        break;
      case "PageDown":
        this.index += 10 * columns;
        break;
      default:
        return false;
    }
    this.clamp(length);
    // Stay put at the edges, but still count the key as handled.
    return before !== this.index || e.key.startsWith("Arrow") || e.key.startsWith("Page") || e.key === "Home" || e.key === "End";
  }
}

/**
 * Render rows for a list. Clicking a row selects it and runs `activate`,
 * so the mouse works too, but nothing needs it.
 */
export function listRows<T>(
  items: T[],
  nav: ListNav,
  row: (item: T, selected: boolean, index: number) => (Node | string | null | false)[],
  activate: (index: number) => void,
  extraClass = "",
): HTMLElement {
  return h(
    "div",
    { class: `list ${extraClass}`, role: "listbox" },
    items.map((item, i) =>
      h(
        "div",
        {
          class: `row${i === nav.index ? " selected" : ""}`,
          role: "option",
          "aria-selected": i === nav.index ? "true" : "false",
          "data-index": i,
          onClick: () => {
            nav.index = i;
            activate(i);
          },
        },
        h("span", { class: "cursor" }, i === nav.index ? "▸" : " "),
        ...row(item, i === nav.index, i),
      ),
    ),
  );
}

/** Scroll the selected row into view after drawing. */
export function scrollSelected(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".row.selected").forEach((el) => el.scrollIntoView({ block: "nearest" }));
}
