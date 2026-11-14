// The weekly to-do list. Each week gets its own list, created from your
// recurring templates the first time you open the app that week.

import { type Day, weekStartOf } from "./dates";
import { type AppData, type TodoItem, type WeekList, newId } from "./model";

export function currentWeekStart(data: AppData, now: Day): Day {
  return weekStartOf(now, data.settings.weekStart);
}

export function findWeek(data: AppData, weekStart: Day): WeekList | undefined {
  return data.weeks.find((w) => w.weekStart === weekStart);
}

/**
 * Make sure this week's list exists. Returns true if a new list was made.
 * New lists get one task per enabled template, plus unfinished tasks from the
 * most recent earlier week when "carry over" is on.
 */
export function ensureWeek(data: AppData, now: Day): boolean {
  const start = currentWeekStart(data, now);
  if (findWeek(data, start)) return false;

  const items: TodoItem[] = data.templates
    .filter((t) => t.enabled)
    .map((t) => ({ id: newId(), title: t.title, detail: "", done: false, templateId: t.id }));

  if (data.settings.carryOver) {
    const previous = data.weeks
      .filter((w) => w.weekStart < start)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
    for (const item of previous?.items ?? []) {
      // Recurring tasks come back on their own, so only carry over the
      // ones that wouldn't otherwise appear, or that had details filled in.
      if (item.done) continue;
      if (item.templateId && !item.detail) continue;
      items.push({
        id: newId(),
        title: item.title,
        detail: item.detail,
        done: false,
        carriedFrom: item.carriedFrom ?? previous!.weekStart,
      });
    }
  }

  data.weeks.push({ weekStart: start, items });
  data.weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return true;
}

export function progress(week: WeekList | undefined): { done: number; total: number } {
  const items = week?.items ?? [];
  return { done: items.filter((i) => i.done).length, total: items.length };
}
