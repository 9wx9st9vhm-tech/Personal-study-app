// Scripture references: reading what you type ("Phil 4:6, 7"), checking it
// is a real book, chapter and verse, showing it neatly, and building a link
// that opens the verse in the New World Translation.

import { BOOKS, type Book } from "./data/bible";

/** A verse span inside one chapter. A single verse has start === end. */
export interface VerseSpan {
  start: number;
  end: number;
}

/** One stored reference, e.g. Philippians 4:6, 7. */
export interface ScriptureRef {
  book: number; // 1-66
  chapter: number;
  /** Empty means the whole chapter, e.g. "Psalm 23". */
  verses: VerseSpan[];
}

export type ParseResult =
  | { ok: true; refs: ScriptureRef[] }
  | { ok: false; error: string };

/** Lowercase, no spaces or periods: "1 Jn." -> "1jn". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(first|1st|i)\s+/, "1")
    .replace(/^(second|2nd|ii)\s+/, "2")
    .replace(/^(third|3rd|iii)\s+/, "3")
    .replace(/[\s.]/g, "");
}

// Every exact spelling we accept, mapped to its book.
const exact = new Map<string, Book>();
for (const book of BOOKS) {
  for (const key of [book.name, book.abbr, ...book.aliases]) {
    exact.set(normalize(key), book);
  }
}

/** Find a book from what the person typed, or explain why we can't. */
export function findBook(typed: string): Book | string {
  const key = normalize(typed);
  if (!key) return "Type a book name first.";
  const hit = exact.get(key);
  if (hit) return hit;
  // Otherwise accept the start of a book's name, if only one book matches.
  const matches = BOOKS.filter((b) => normalize(b.name).startsWith(key));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    return `"${typed.trim()}" could be ${matches.map((b) => b.name).join(", ")}.`;
  }
  return `I don't know a book called "${typed.trim()}".`;
}

/**
 * Read one or more references separated by semicolons.
 * Accepts forms like "John 3:16", "Phil 4:6, 7", "Ps 23", "Ps 23:1-4",
 * "1 John 4:8" and "Jude 9" (one-chapter books take the verse directly).
 */
export function parseScriptures(input: string): ParseResult {
  const parts = input.split(";").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: "Type a scripture, like John 3:16." };
  const refs: ScriptureRef[] = [];
  let lastBook: Book | null = null;
  for (const part of parts) {
    const result = parseOne(part, lastBook);
    if (typeof result === "string") return { ok: false, error: result };
    refs.push(result);
    lastBook = BOOKS[result.book - 1];
  }
  return { ok: true, refs };
}

function parseOne(text: string, previousBook: Book | null): ScriptureRef | string {
  // Split "1 John 4:8" into the book part and the numbers part.
  const m = text.match(/^(.*?[a-zA-Z.])\s*(\d[\d\s:,\-–]*)$/);
  let book: Book;
  let numbers: string;
  if (m) {
    const found = findBook(m[1]);
    if (typeof found === "string") return found;
    book = found;
    numbers = m[2].replace(/\s/g, "").replace(/–/g, "-");
  } else if (previousBook && /^[\d\s:,\-–]+$/.test(text)) {
    // "John 3:16; 17:3" -> the second part reuses John.
    book = previousBook;
    numbers = text.replace(/\s/g, "").replace(/–/g, "-");
  } else {
    return `I couldn't read "${text}". Try something like John 3:16.`;
  }

  const oneChapter = book.verses.length === 1;
  let chapter: number;
  let versePart: string;
  if (numbers.includes(":")) {
    const [c, v, extra] = numbers.split(":");
    if (extra !== undefined) return `"${text}" spans chapters. Add each chapter separately.`;
    chapter = Number(c);
    versePart = v;
  } else if (oneChapter) {
    chapter = 1;
    versePart = numbers;
  } else {
    chapter = Number(numbers);
    versePart = "";
    if (!Number.isInteger(chapter)) return `"${text}" spans chapters. Add each chapter separately.`;
  }

  const chapters = book.verses.length;
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters) {
    return `${book.name} has ${chapters} chapter${chapters === 1 ? "" : "s"}.`;
  }
  const maxVerse = book.verses[chapter - 1];
  const verses: VerseSpan[] = [];
  if (versePart) {
    for (const item of versePart.split(",").filter(Boolean)) {
      const [a, b] = item.split("-");
      const start = Number(a);
      const end = b === undefined ? start : Number(b);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        return `I couldn't read the verses in "${text}".`;
      }
      if (end > maxVerse) {
        return `${chapterName(book, chapter)} has ${maxVerse} verses.`;
      }
      verses.push({ start, end });
    }
  }
  return { book: book.num, chapter, verses: mergeSpans(verses) };
}

/** Sort spans and join ones that touch: 6, 7, 8 -> 6-8. */
function mergeSpans(spans: VerseSpan[]): VerseSpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out: VerseSpan[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start <= last.end + 1) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

/** "Psalm 23" for one psalm, otherwise "Genesis 1". */
function chapterName(book: Book, chapter: number): string {
  const name = book.num === 19 ? "Psalm" : book.name;
  return book.verses.length === 1 ? name : `${name} ${chapter}`;
}

/** Display a reference the way publications write it: "Philippians 4:6, 7". */
export function formatRef(ref: ScriptureRef): string {
  const book = BOOKS[ref.book - 1];
  if (ref.verses.length === 0) return chapterName(book, ref.chapter);
  const verses = ref.verses
    .map((s) =>
      s.start === s.end ? `${s.start}` : s.end === s.start + 1 ? `${s.start}, ${s.end}` : `${s.start}-${s.end}`,
    )
    .join(", ");
  const name = book.num === 19 ? "Psalm" : book.name;
  return book.verses.length === 1 ? `${name} ${verses}` : `${name} ${ref.chapter}:${verses}`;
}

export type LinkTarget = "web" | "app";

/**
 * A link that opens the reference in the New World Translation.
 * jw.org identifies a verse by an 8-digit code: book (2 digits), chapter (3)
 * and verse (3), so John 3:16 is 43003016. A span is "start-end".
 * This format comes from how jw.org's own share links look; it isn't an
 * officially documented interface, so it could change.
 */
export function refLink(ref: ScriptureRef, target: LinkTarget): string {
  const code = (v: number) =>
    String(ref.book).padStart(2, "0") + String(ref.chapter).padStart(3, "0") + String(v).padStart(3, "0");
  const first = ref.verses.length ? ref.verses[0].start : 1;
  const last = ref.verses.length
    ? ref.verses[ref.verses.length - 1].end
    : BOOKS[ref.book - 1].verses[ref.chapter - 1];
  const bible = first === last ? code(first) : `${code(first)}-${code(last)}`;
  return target === "app"
    ? `jwlibrary:///finder?bible=${bible}`
    : `https://www.jw.org/finder?wtlocale=E&prefer=lang&bible=${bible}&pub=nwtsty`;
}

/** A link to a whole chapter (used by the reading tracker). */
export function chapterLink(book: number, chapter: number, target: LinkTarget): string {
  return refLink({ book, chapter, verses: [] }, target);
}

/** Parse a reference you know is valid (used for the built-in topic list). */
export function ref(text: string): ScriptureRef {
  const r = parseScriptures(text);
  if (!r.ok || r.refs.length !== 1) throw new Error(`Bad built-in reference: ${text}`);
  return r.refs[0];
}
