// Tests for the parts with real rules in them. Run with: npm test

import { describe, expect, it } from "vitest";
import { BOOKS, TOTAL_CHAPTERS } from "./data/bible";
import { formatRef, parseScriptures, refLink } from "./scripture";
import { addDays, weekStartOf } from "./dates";
import { emptyData, normalizeData } from "./model";
import { BUILT_IN_TOPICS, DAILY_REFERENCES, lastStudied, pickTopic } from "./topics";
import { ensureWeek, findWeek } from "./week";

const show = (text: string) => {
  const r = parseScriptures(text);
  if (!r.ok) return `ERROR: ${r.error}`;
  return r.refs.map(formatRef).join("; ");
};

describe("Bible data", () => {
  it("has 66 books, 1,189 chapters and 31,102 verses", () => {
    expect(BOOKS).toHaveLength(66);
    expect(TOTAL_CHAPTERS).toBe(1189);
    expect(BOOKS.reduce((n, b) => n + b.verses.reduce((a, v) => a + v, 0), 0)).toBe(31102);
  });
  it("has the right chapter counts for a few books", () => {
    expect(BOOKS[18].verses).toHaveLength(150); // Psalms
    expect(BOOKS[18].verses[118]).toBe(176); // Psalm 119
    expect(BOOKS[42].verses[2]).toBe(36); // John 3
    expect(BOOKS[63].verses).toEqual([14]); // 3 John
  });
});

describe("reading scripture references", () => {
  it("understands common forms", () => {
    expect(show("Philippians 4:6, 7")).toBe("Philippians 4:6, 7");
    expect(show("phil 4:6,7")).toBe("Philippians 4:6, 7");
    expect(show("Php 4:6-7")).toBe("Philippians 4:6, 7");
    expect(show("John 3:16")).toBe("John 3:16");
    expect(show("1 John 4:8")).toBe("1 John 4:8");
    expect(show("1jn 4:8")).toBe("1 John 4:8");
    expect(show("First John 4:8")).toBe("1 John 4:8");
    expect(show("Ps 23")).toBe("Psalm 23");
    expect(show("psalm 23:1-4")).toBe("Psalm 23:1-4");
    expect(show("Ps 83:18")).toBe("Psalm 83:18");
    expect(show("Jude 9")).toBe("Jude 9");
    expect(show("Re 21:3, 4")).toBe("Revelation 21:3, 4");
    expect(show("Song of Solomon 8:6")).toBe("Song of Solomon 8:6");
    expect(show("Heb 11:1, 6")).toBe("Hebrews 11:1, 6");
    expect(show("Matt 24:14 ")).toBe("Matthew 24:14");
    expect(show("Ge 1:1, 2, 3")).toBe("Genesis 1:1-3");
  });
  it("reads several references at once", () => {
    expect(show("John 3:16; Rom 5:12")).toBe("John 3:16; Romans 5:12");
    expect(show("John 3:16; 17:3")).toBe("John 3:16; John 17:3");
  });
  it("explains mistakes", () => {
    expect(show("Hezekiah 3:1")).toMatch(/don't know a book/);
    expect(show("Jo 3:16")).toMatch(/could be/);
    expect(show("Philippians 5:1")).toMatch(/has 4 chapters/);
    expect(show("Philippians 4:30")).toMatch(/has 23 verses/);
    expect(show("Genesis 1:1-2:3")).toMatch(/spans chapters/);
  });
});

describe("links to the New World Translation", () => {
  const one = (t: string) => {
    const r = parseScriptures(t);
    if (!r.ok) throw new Error(r.error);
    return r.refs[0];
  };
  it("builds jw.org links", () => {
    expect(refLink(one("John 3:16"), "web")).toBe(
      "https://www.jw.org/finder?wtlocale=E&prefer=lang&bible=43003016&pub=nwtsty",
    );
    expect(refLink(one("Phil 4:6, 7"), "web")).toContain("bible=50004006-50004007");
    expect(refLink(one("Ps 23"), "web")).toContain("bible=19023001-19023006");
  });
  it("builds JW Library links", () => {
    expect(refLink(one("Matt 24:14"), "app")).toBe("jwlibrary:///finder?bible=40024014");
  });
});

describe("built-in topics", () => {
  it("all have valid starting scriptures", () => {
    expect(BUILT_IN_TOPICS.length).toBeGreaterThan(40);
    for (const t of BUILT_IN_TOPICS) expect(t.starters.length).toBeGreaterThan(0);
    for (const r of DAILY_REFERENCES) expect(parseScriptures(r).ok, r).toBe(true);
  });
  it("have unique ids", () => {
    expect(new Set(BUILT_IN_TOPICS.map((t) => t.id)).size).toBe(BUILT_IN_TOPICS.length);
  });
});

describe("random topic", () => {
  const today = "2026-11-14";
  it("skips topics studied recently", () => {
    const data = emptyData(BUILT_IN_TOPICS.slice(0, 2));
    data.projects.push({
      id: "p1", title: "x", topicId: data.topics[0].id, scriptures: [], notes: "",
      status: "active", createdAt: addDays(today, -3), updatedAt: "",
    });
    for (let i = 0; i < 20; i++) {
      expect(pickTopic(data, today, { random: () => i / 20 })?.id).toBe(data.topics[1].id);
    }
  });
  it("counts a project with the same title as studying that topic", () => {
    const data = emptyData(BUILT_IN_TOPICS.slice(0, 3));
    data.projects.push({
      id: "p1", title: "prayer ", scriptures: [], notes: "", status: "active", createdAt: today, updatedAt: "",
    });
    expect(lastStudied(data).get("builtin:prayer")).toBe(today);
  });
  it("falls back to the least recent when everything is recent", () => {
    const data = emptyData(BUILT_IN_TOPICS.slice(0, 2));
    data.projects.push(
      { id: "a", title: "", topicId: data.topics[0].id, scriptures: [], notes: "", status: "active", createdAt: addDays(today, -2), updatedAt: "" },
      { id: "b", title: "", topicId: data.topics[1].id, scriptures: [], notes: "", status: "active", createdAt: addDays(today, -1), updatedAt: "" },
    );
    expect(pickTopic(data, today)?.id).toBe(data.topics[0].id);
  });
  it("never repeats the topic on screen when asking for another", () => {
    const data = emptyData(BUILT_IN_TOPICS.slice(0, 2));
    for (let i = 0; i < 10; i++) {
      expect(pickTopic(data, today, { exclude: data.topics[0].id, random: () => i / 10 })?.id).toBe(data.topics[1].id);
    }
  });
  it("ignores hidden topics", () => {
    const data = emptyData(BUILT_IN_TOPICS.slice(0, 2));
    data.topics[1].hidden = true;
    expect(pickTopic(data, today)?.id).toBe(data.topics[0].id);
  });
});

describe("weekly to-do", () => {
  it("finds the start of the week", () => {
    expect(weekStartOf("2026-11-14", 1)).toBe("2026-11-09"); // Saturday -> Monday
    expect(weekStartOf("2026-11-09", 1)).toBe("2026-11-09");
    expect(weekStartOf("2026-11-14", 0)).toBe("2026-11-08"); // -> Sunday
  });
  it("makes a list from templates once per week", () => {
    const data = emptyData([]);
    expect(ensureWeek(data, "2026-11-14")).toBe(true);
    expect(ensureWeek(data, "2026-11-15")).toBe(false);
    expect(findWeek(data, "2026-11-09")?.items.map((i) => i.title)).toEqual([
      "Midweek meeting preparation",
      "Watchtower Study preparation",
      "Weekly Bible reading",
      "Personal study session",
    ]);
  });
  it("carries over unfinished one-off tasks", () => {
    const data = emptyData([]);
    ensureWeek(data, "2026-11-10");
    const w = findWeek(data, "2026-11-09")!;
    w.items.push({ id: "x", title: "Prepare return visit", detail: "", done: false });
    w.items.push({ id: "y", title: "Done thing", detail: "", done: true });
    ensureWeek(data, "2026-11-17");
    const next = findWeek(data, "2026-11-16")!;
    expect(next.items.map((i) => i.title)).toContain("Prepare return visit");
    expect(next.items.map((i) => i.title)).not.toContain("Done thing");
    expect(next.items.filter((i) => i.title === "Weekly Bible reading")).toHaveLength(1);
  });
  it("doesn't carry over when the setting is off", () => {
    const data = emptyData([]);
    data.settings.carryOver = false;
    ensureWeek(data, "2026-11-10");
    findWeek(data, "2026-11-09")!.items.push({ id: "x", title: "One-off", detail: "", done: false });
    ensureWeek(data, "2026-11-17");
    expect(findWeek(data, "2026-11-16")!.items.map((i) => i.title)).not.toContain("One-off");
  });
});

describe("loading saved data", () => {
  it("fills in anything missing and adds new built-in topics", () => {
    const data = normalizeData({ projects: [], settings: { theme: "paper", lookVersion: 2 } }, BUILT_IN_TOPICS);
    expect(data.settings.theme).toBe("paper");
    expect(normalizeData({ settings: { theme: "amber" } }, BUILT_IN_TOPICS).settings.theme).toBe("white");
    expect(data.settings.weekStart).toBe(1);
    expect(data.topics).toHaveLength(BUILT_IN_TOPICS.length);
    expect(data.templates).toHaveLength(4);
  });
  it("survives garbage", () => {
    expect(normalizeData("nonsense", BUILT_IN_TOPICS).projects).toEqual([]);
  });
});
