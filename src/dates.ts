// Date helpers. Days are stored as "YYYY-MM-DD" strings in your Mac's local
// time, so "today" always means today where you are (never shifted by UTC).

export type Day = string;

export function dayOf(date: Date): Day {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): Day {
  return dayOf(new Date());
}

/** Turn "YYYY-MM-DD" back into a Date at local midnight. */
export function parseDay(day: Day): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: Day, n: number): Day {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return dayOf(date);
}

/** Whole days from a to b (b later = positive). */
export function daysBetween(a: Day, b: Day): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

/** The first day of the week containing `day`. weekStart: 0 = Sunday ... 6 = Saturday. */
export function weekStartOf(day: Day, weekStart: number): Day {
  const offset = (parseDay(day).getDay() - weekStart + 7) % 7;
  return addDays(day, -offset);
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Fri 14 Nov" */
export function shortDate(day: Day): string {
  const d = parseDay(day);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "14 Nov 2026" */
export function longDate(day: Day): string {
  const d = parseDay(day);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "today", "yesterday", "3 days ago", or a date. */
export function relativeDay(day: Day, now: Day = today()): string {
  const n = daysBetween(day, now);
  if (n === 0) return "today";
  if (n === 1) return "yesterday";
  if (n > 1 && n < 7) return `${n} days ago`;
  return longDate(day);
}
