// The app's core: holds your data, draws the terminal frame around the
// current screen, routes key presses, saves changes, and shows dialogs.

import { type AppData, normalizeData, newId } from "./model";
import { type Day, shortDate, today } from "./dates";
import { type Hint, h, isTyping } from "./ui/dom";
import { type ScriptureRef, refLink, chapterLink } from "./scripture";
import { BUILT_IN_TOPICS } from "./topics";
import { ensureWeek } from "./week";
import { storage } from "./storage";

export type Section = "home" | "notes" | "topic" | "week" | "reading" | "history" | "settings";

/** The tabs along the top, in order. The number keys 1-7 jump to them. */
export const SECTIONS: { id: Section; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "notes", label: "Notes" },
  { id: "topic", label: "Topic" },
  { id: "week", label: "Week" },
  { id: "reading", label: "Reading" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
];

/** Every screen (Home, a note page, the reading tracker...) follows this shape. */
export interface Screen {
  section: Section;
  title: string;
  hints(): Hint[];
  render(): HTMLElement;
  /** Return true if the screen used the key. */
  onKey(e: KeyboardEvent): boolean;
  /** Runs after the screen is on the page (to focus a text box, scroll...). */
  mounted?(root: HTMLElement): void;
  /** Runs when you leave the screen. */
  leave?(): void;
}

type ScreenFactory = (app: App) => Screen;

interface Dialog {
  render(): HTMLElement;
  onKey(e: KeyboardEvent): boolean;
  mounted?(root: HTMLElement): void;
}

export class App {
  data!: AppData;
  today: Day = today();
  /** True while the start-up animation plays (keys are ignored). */
  booting = false;
  private stack: Screen[] = [];
  private dialog: Dialog | null = null;
  private status = "";
  private statusTimer = 0;
  private saveTimer = 0;
  private dirty = false;
  private factories = new Map<Section, ScreenFactory>();
  private helpFactory: ScreenFactory | null = null;

  constructor(private root: HTMLElement) {}

  register(section: Section, factory: ScreenFactory): void {
    this.factories.set(section, factory);
  }

  registerHelp(factory: ScreenFactory): void {
    this.helpFactory = factory;
  }

  async start(): Promise<void> {
    let raw: unknown = null;
    try {
      const text = await storage.load();
      raw = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error(err);
      this.flash("Couldn't read saved data. Starting fresh; your old file is untouched.");
    }
    this.data = normalizeData(raw, BUILT_IN_TOPICS);
    if (ensureWeek(this.data, this.today)) this.markDirty();
    this.applyTheme();

    document.addEventListener("keydown", (e) => this.handleKey(e));
    window.addEventListener("blur", () => void this.flush());
    window.addEventListener("beforeunload", () => void this.flush());
    // Notice when the day changes while the app stays open.
    window.setInterval(() => this.checkNewDay(), 60_000);
    await this.registerCloseHandler();

    this.goSection("home");
  }

  // ---- navigation -------------------------------------------------------

  get screen(): Screen {
    return this.stack[this.stack.length - 1];
  }

  /** Jump to a tab, starting fresh from Home. */
  goSection(section: Section): void {
    this.leaveAll();
    const home = this.factories.get("home")!(this);
    this.stack = [home];
    if (section !== "home") this.stack.push(this.factories.get(section)!(this));
    this.render();
  }

  /** Open a screen on top of the current one. Esc comes back. */
  push(screen: Screen): void {
    this.stack.push(screen);
    this.render();
  }

  /** Go back one screen. */
  pop(): void {
    if (this.stack.length <= 1) return;
    this.stack.pop()!.leave?.();
    this.render();
  }

  /** Swap the current screen for another (no extra Esc step). */
  replace(screen: Screen): void {
    this.stack.pop()?.leave?.();
    this.stack.push(screen);
    this.render();
  }

  private leaveAll(): void {
    for (const s of this.stack) s.leave?.();
  }

  // ---- data --------------------------------------------------------------

  /** Change data, save soon, and redraw. */
  update(change: (data: AppData) => void, options: { render?: boolean } = {}): void {
    change(this.data);
    this.markDirty();
    if (options.render !== false) this.render();
  }

  markDirty(): void {
    this.dirty = true;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.flush(), 400);
  }

  /** Save now if anything changed. */
  async flush(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;
    window.clearTimeout(this.saveTimer);
    try {
      await storage.save(JSON.stringify(this.data), today());
    } catch (err) {
      console.error(err);
      this.dirty = true;
      this.flash("Couldn't save. Your changes are still here; I'll try again.");
      this.saveTimer = window.setTimeout(() => void this.flush(), 5000);
    }
  }

  /** Called whenever a note page opens: checks off the habit and logs a session. */
  recordStudy(projectId: string): void {
    const day = today();
    this.update(
      (d) => {
        if (!d.habitDays.includes(day)) d.habitDays.push(day);
        if (!d.sessions.some((s) => s.day === day && s.projectId === projectId)) {
          d.sessions.push({ id: newId(), day, projectId, at: new Date().toISOString() });
        }
        d.lastProjectId = projectId;
      },
      { render: false },
    );
  }

  private checkNewDay(): void {
    const now = today();
    if (now === this.today) return;
    this.today = now;
    if (ensureWeek(this.data, now)) this.markDirty();
    this.render();
  }

  private async registerCloseHandler(): Promise<void> {
    if (!storage.inApp) return;
    // Save before the window closes.
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().onCloseRequested(async () => {
      await this.flush();
    });
  }

  // ---- look --------------------------------------------------------------

  applyTheme(): void {
    document.documentElement.dataset.theme = this.data.settings.theme;
    document.documentElement.classList.toggle("scanlines", this.data.settings.scanlines);
  }

  /** Show a short message in the status bar. */
  flash(message: string): void {
    this.status = message;
    const el = this.root.querySelector(".status");
    if (el) el.textContent = message;
    window.clearTimeout(this.statusTimer);
    this.statusTimer = window.setTimeout(() => {
      this.status = "";
      const s = this.root.querySelector(".status");
      if (s) s.textContent = "";
    }, 4000);
  }

  async openRef(ref: ScriptureRef): Promise<void> {
    await this.openUrl(refLink(ref, this.data.settings.linkTarget));
  }

  async openChapter(book: number, chapter: number): Promise<void> {
    await this.openUrl(chapterLink(book, chapter, this.data.settings.linkTarget));
  }

  private async openUrl(url: string): Promise<void> {
    try {
      await storage.openUrl(url);
      this.flash("Opening in the New World Translation…");
    } catch (err) {
      console.error(err);
      this.flash("Couldn't open the link.");
    }
  }

  // ---- drawing -----------------------------------------------------------

  render(): void {
    const screen = this.screen;
    const tabs = h(
      "nav",
      { class: "tabs" },
      SECTIONS.map((s, i) =>
        h(
          "button",
          {
            class: `tab${s.id === screen.section ? " active" : ""}`,
            tabindex: -1,
            onClick: () => this.goSection(s.id),
          },
          h("span", { class: "tab-key" }, String(i + 1)),
          s.label,
        ),
      ),
    );
    const habitToday = this.data.habitDays.includes(today());
    const header = h(
      "header",
      { class: "top" },
      h("div", { class: "brand" }, h("span", { class: "brand-mark" }, "◆"), " PERSONAL STUDY"),
      tabs,
      h(
        "div",
        { class: "clock" },
        h("span", { class: habitToday ? "habit on" : "habit", title: "Habit tracker: today" }, habitToday ? "● studied" : "○ not yet"),
        "  ",
        shortDate(today()),
      ),
    );

    const crumbs = this.stack.slice(1).map((s) => s.title);
    const main = h(
      "main",
      { class: "screen" },
      crumbs.length > 1 ? h("div", { class: "crumbs" }, ["~", ...crumbs].join(" / ")) : null,
      screen.render(),
    );

    const hints = [...screen.hints()];
    if (this.stack.length > 1) hints.push({ key: "esc", label: "back" });
    hints.push({ key: "?", label: "help" });
    const footer = h(
      "footer",
      { class: "bottom" },
      h(
        "div",
        { class: "hints" },
        hints.map((x) => h("span", { class: "hint" }, h("kbd", {}, x.key), " ", x.label)),
      ),
      h("div", { class: "status", role: "status" }, this.status),
    );

    const frame = h("div", { class: "frame" }, header, main, footer);
    this.root.replaceChildren(frame);
    if (this.dialog) this.root.append(h("div", { class: "overlay" }, this.dialog.render()));
    screen.mounted?.(main);
    if (this.dialog) this.dialog.mounted?.(this.root.querySelector(".overlay")!);
  }

  // ---- keys --------------------------------------------------------------

  private handleKey(e: KeyboardEvent): void {
    if (this.booting) return;
    if (this.dialog) {
      if (this.dialog.onKey(e)) e.preventDefault();
      return;
    }
    if (this.screen.onKey(e)) {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (isTyping(e)) (e.target as HTMLElement).blur();
      this.pop();
      return;
    }
    if (isTyping(e)) return;
    if (/^[1-7]$/.test(e.key)) {
      e.preventDefault();
      this.goSection(SECTIONS[Number(e.key) - 1].id);
    } else if (e.key === "?" && this.helpFactory) {
      e.preventDefault();
      this.push(this.helpFactory(this));
    }
  }

  // ---- dialogs -----------------------------------------------------------

  private openDialog(dialog: Dialog): void {
    this.dialog = dialog;
    this.render();
  }

  private closeDialog(): void {
    this.dialog = null;
    this.render();
  }

  /** Ask a yes/no question. ← → or y / n, Enter to choose. */
  confirm(message: string, yes = "Yes", no = "Cancel"): Promise<boolean> {
    return new Promise((resolve) => {
      let choice = 1; // start on the safe answer
      const done = (v: boolean) => {
        this.closeDialog();
        resolve(v);
      };
      this.openDialog({
        render: () =>
          h(
            "div",
            { class: "dialog", role: "dialog" },
            h("p", {}, message),
            h(
              "div",
              { class: "choices" },
              [yes, no].map((label, i) =>
                h("button", { class: `choice${choice === i ? " selected" : ""}`, tabindex: -1, onClick: () => done(i === 0) }, `[ ${label} ]`),
              ),
            ),
          ),
        onKey: (e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Tab") {
            choice = 1 - choice;
            this.render();
          } else if (e.key === "Enter" || e.key === " ") done(choice === 0);
          else if (e.key.toLowerCase() === "y") done(true);
          else if (e.key.toLowerCase() === "n" || e.key === "Escape") done(false);
          return true;
        },
      });
    });
  }

  /** Ask for a line of text. Enter to accept, Esc to cancel. */
  prompt(label: string, initial = "", placeholder = ""): Promise<string | null> {
    return new Promise((resolve) => {
      let value = initial;
      const done = (v: string | null) => {
        this.closeDialog();
        resolve(v);
      };
      this.openDialog({
        render: () =>
          h(
            "div",
            { class: "dialog", role: "dialog" },
            h("label", { class: "dialog-label" }, label),
            h(
              "div",
              { class: "prompt-line" },
              h("span", { class: "prompt-sign" }, "›"),
              h("input", {
                class: "field",
                value,
                placeholder,
                spellcheck: false,
                onInput: (e: Event) => (value = (e.target as HTMLInputElement).value),
              }),
            ),
            h("p", { class: "dim small" }, "enter to save · esc to cancel"),
          ),
        mounted: (root) => {
          const input = root.querySelector("input")!;
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        },
        onKey: (e) => {
          if (e.key === "Enter") {
            done(value.trim() ? value.trim() : null);
            return true;
          }
          if (e.key === "Escape") {
            done(null);
            return true;
          }
          return false; // let typing reach the input
        },
      });
    });
  }

  /** Pick one item from a list with ↑ ↓ and Enter. */
  choose(title: string, options: string[], start = 0): Promise<number | null> {
    return new Promise((resolve) => {
      let index = start;
      const done = (v: number | null) => {
        this.closeDialog();
        resolve(v);
      };
      this.openDialog({
        render: () =>
          h(
            "div",
            { class: "dialog wide", role: "dialog" },
            h("p", {}, title),
            h(
              "div",
              { class: "list" },
              options.map((o, i) =>
                h(
                  "div",
                  { class: `row${i === index ? " selected" : ""}`, onClick: () => done(i) },
                  h("span", { class: "cursor" }, i === index ? "▸" : " "),
                  h("span", {}, o),
                ),
              ),
            ),
            h("p", { class: "dim small" }, "↑↓ choose · enter select · esc cancel"),
          ),
        mounted: (root) => root.querySelector(".row.selected")?.scrollIntoView({ block: "nearest" }),
        onKey: (e) => {
          if (e.key === "ArrowUp") index = Math.max(0, index - 1);
          else if (e.key === "ArrowDown") index = Math.min(options.length - 1, index + 1);
          else if (e.key === "Enter") return done(index), true;
          else if (e.key === "Escape") return done(null), true;
          else return true;
          this.render();
          return true;
        },
      });
    });
  }
}
