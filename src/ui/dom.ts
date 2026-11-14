// A tiny helper for building HTML elements in code:
//   h("div", { class: "box" }, "hello", h("b", {}, "world"))

type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "class") {
      el.className = String(value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key in el && typeof value !== "string") {
      (el as unknown as Record<string, unknown>)[key] = value;
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

/** A titled panel with the title set into its top border, like a terminal UI. */
export function panel(title: string, ...children: (Child | Child[])[]): HTMLElement {
  return h("section", { class: "panel" }, h("h2", { class: "panel-title" }, title), ...children);
}

/** A text progress bar: ▰▰▰▱▱ */
export function bar(done: number, total: number, width = 20): HTMLElement {
  const filled = total === 0 ? 0 : Math.round((done / total) * width);
  return h(
    "span",
    { class: "bar", "aria-label": `${done} of ${total}` },
    h("span", { class: "bar-on" }, "█".repeat(filled)),
    h("span", { class: "bar-off" }, "░".repeat(width - filled)),
  );
}

/** Keyboard hint shown in the footer: [key] label */
export interface Hint {
  key: string;
  label: string;
}

/** True when the key press came from a text box (so letters are typing). */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}
