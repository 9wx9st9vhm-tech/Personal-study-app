// The Bible reading tracker: all 66 books, checked off chapter by chapter.

import type { App, Screen } from "../app";
import { bar, h, panel } from "../ui/dom";
import { BOOKS, FIRST_GREEK_BOOK, TOTAL_CHAPTERS, type Book } from "../data/bible";
import { longDate, today } from "../dates";

const key = (book: number, chapter: number) => `${book}:${chapter}`;

function readCount(app: App, book: Book): number {
  let n = 0;
  for (let c = 1; c <= book.verses.length; c++) if (app.data.reading[key(book.num, c)]) n++;
  return n;
}

export function readingScreen(app: App): Screen {
  let index = 0; // 0-65, the selected book

  const hebrew = BOOKS.filter((b) => b.num < FIRST_GREEK_BOOK);
  const greek = BOOKS.filter((b) => b.num >= FIRST_GREEK_BOOK);

  const column = (title: string, books: Book[]) =>
    panel(
      title,
      h(
        "div",
        { class: "list books" },
        books.map((b) => {
          const read = readCount(app, b);
          const total = b.verses.length;
          const selected = b.num - 1 === index;
          return h(
            "div",
            {
              class: `row${selected ? " selected" : ""}`,
              onClick: () => {
                index = b.num - 1;
                app.push(bookScreen(app, b));
              },
            },
            h("span", { class: "cursor" }, selected ? "▸" : " "),
            h("span", { class: `grow${read === total ? " ok" : ""}` }, b.name),
            bar(read, total, 8),
            h("span", { class: "dim count" }, `${read}/${total}`),
          );
        }),
      ),
    );

  return {
    section: "reading",
    title: "reading",
    hints: () => [
      { key: "↑↓←→", label: "move" },
      { key: "⏎", label: "open book" },
    ],
    render() {
      const read = Object.keys(app.data.reading).length;
      return h(
        "div",
        { class: "reading" },
        h(
          "div",
          { class: "week-head" },
          h("span", { class: "accent" }, "whole Bible "),
          bar(read, TOTAL_CHAPTERS, 30),
          ` ${read}/${TOTAL_CHAPTERS} chapters · ${((read / TOTAL_CHAPTERS) * 100).toFixed(1)}%`,
        ),
        h("div", { class: "columns" }, column("hebrew scriptures", hebrew), column("christian greek scriptures", greek)),
      );
    },
    mounted(root) {
      root.querySelectorAll<HTMLElement>(".row.selected").forEach((el) => el.scrollIntoView({ block: "nearest" }));
    },
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const inGreek = index >= FIRST_GREEK_BOOK - 1;
      const row = inGreek ? index - (FIRST_GREEK_BOOK - 1) : index;
      switch (e.key) {
        case "ArrowUp":
          if (row > 0) index--;
          break;
        case "ArrowDown":
          if (inGreek ? index < 65 : index < FIRST_GREEK_BOOK - 2) index++;
          break;
        case "ArrowRight":
          if (!inGreek) index = FIRST_GREEK_BOOK - 1 + Math.min(row, greek.length - 1);
          break;
        case "ArrowLeft":
          if (inGreek) index = row;
          else return app.pop(), true;
          break;
        case "Home":
          index = inGreek ? FIRST_GREEK_BOOK - 1 : 0;
          break;
        case "End":
          index = inGreek ? 65 : FIRST_GREEK_BOOK - 2;
          break;
        case "Enter":
          app.push(bookScreen(app, BOOKS[index]));
          return true;
        default:
          return false;
      }
      app.render();
      return true;
    },
  };
}

const COLUMNS = 10;

export function bookScreen(app: App, book: Book): Screen {
  let chapter = 1;
  const total = book.verses.length;
  const isRead = (c: number) => !!app.data.reading[key(book.num, c)];

  const toggle = (c: number) => {
    app.update((d) => {
      const k = key(book.num, c);
      if (d.reading[k]) delete d.reading[k];
      else d.reading[k] = today();
    });
    if (readCount(app, book) === total) app.flash(`You've read all of ${book.name}!`);
  };

  const toggleAll = async () => {
    const all = readCount(app, book) === total;
    const ok = await app.confirm(all ? `Clear all ${total} chapters of ${book.name}?` : `Mark all ${total} chapters of ${book.name} as read?`, all ? "Clear" : "Mark read", "Cancel");
    if (!ok) return;
    app.update((d) => {
      for (let c = 1; c <= total; c++) {
        const k = key(book.num, c);
        if (all) delete d.reading[k];
        else d.reading[k] ??= today();
      }
    });
  };

  return {
    section: "reading",
    title: book.name.toLowerCase(),
    hints: () => [
      { key: "↑↓←→", label: "move" },
      { key: "space", label: "read/unread" },
      { key: "o", label: "open in NWT" },
      { key: "a", label: "all" },
    ],
    render() {
      const read = readCount(app, book);
      const when = app.data.reading[key(book.num, chapter)];
      return h(
        "div",
        {},
        h(
          "div",
          { class: "week-head" },
          h("span", { class: "accent" }, `${book.name} `),
          bar(read, total, 24),
          ` ${read}/${total} chapters`,
        ),
        panel(
          "chapters",
          h(
            "div",
            { class: "chapter-grid", style: { gridTemplateColumns: `repeat(${COLUMNS}, 4.6em)` } },
            Array.from({ length: total }, (_, i) => i + 1).map((c) =>
              h(
                "button",
                {
                  class: `chap${isRead(c) ? " read" : ""}${c === chapter ? " selected" : ""}`,
                  tabindex: -1,
                  onClick: () => {
                    chapter = c;
                    toggle(c);
                  },
                },
                isRead(c) ? `■${c}` : `□${c}`,
              ),
            ),
          ),
        ),
        h(
          "p",
          { class: "dim small" },
          `chapter ${chapter}: `,
          when ? `read ${longDate(when)}` : "not read yet",
          ` · ${book.verses[chapter - 1]} verses`,
        ),
      );
    },
    mounted(root) {
      root.querySelector(".chap.selected")?.scrollIntoView({ block: "nearest" });
    },
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      switch (e.key) {
        case "ArrowLeft":
          if (chapter > 1) chapter--;
          break;
        case "ArrowRight":
          if (chapter < total) chapter++;
          break;
        case "ArrowUp":
          if (chapter - COLUMNS >= 1) chapter -= COLUMNS;
          break;
        case "ArrowDown":
          if (chapter + COLUMNS <= total) chapter += COLUMNS;
          break;
        case "Home":
          chapter = 1;
          break;
        case "End":
          chapter = total;
          break;
        case " ":
        case "Enter":
        case "x":
          toggle(chapter);
          return true;
        case "o":
          void app.openChapter(book.num, chapter);
          return true;
        case "a":
          void toggleAll();
          return true;
        default:
          return false;
      }
      app.render();
      return true;
    },
  };
}
