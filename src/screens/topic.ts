// The random topic button, and a screen to manage the topic list.

import type { App, Screen } from "../app";
import { h, panel } from "../ui/dom";
import { ListNav, listRows, scrollSelected } from "../ui/list";
import { lastStudied, pickTopic } from "../topics";
import { formatRef } from "../scripture";
import { relativeDay } from "../dates";
import { type Topic, newId } from "../model";
import { openNewProject } from "./editor";

export function topicScreen(app: App): Screen {
  const nav = new ListNav();
  let topic: Topic | null = null;
  let rolling = 0; // animation frames left

  const pick = (exclude?: string) => {
    topic = pickTopic(app.data, app.today, { exclude });
    if (topic) {
      const id = topic.id;
      app.update(
        (d) => {
          d.topicPicks.push({ topicId: id, at: new Date().toISOString(), started: false });
          if (d.topicPicks.length > 500) d.topicPicks.splice(0, d.topicPicks.length - 500);
        },
        { render: false },
      );
    }
    // A short "shuffling" effect for a bit of fun.
    rolling = 6;
    const tick = () => {
      rolling--;
      app.render();
      if (rolling > 0) window.setTimeout(tick, 55);
    };
    tick();
  };

  const start = () => {
    if (!topic) return;
    const t = topic;
    app.update(
      (d) => {
        const last = [...d.topicPicks].reverse().find((p) => p.topicId === t.id);
        if (last) last.started = true;
      },
      { render: false },
    );
    void openNewProject(app, {
      title: t.title,
      topicId: t.id,
      scriptures: t.starters,
      notes: t.question ? `${t.question}\n\n` : "",
    });
  };

  const actions = [
    { label: "Start studying this", run: start },
    { label: "Give me another", run: () => pick(topic?.id) },
    { label: "Manage topics", run: () => app.push(manageTopicsScreen(app)) },
  ];

  pick();

  return {
    section: "topic",
    title: "topic",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "⏎", label: "choose" },
      { key: "space", label: "another" },
      { key: "s", label: "start" },
    ],
    render() {
      const visible = app.data.topics.filter((t) => !t.hidden);
      const shown = rolling > 0 ? visible[Math.floor(Math.random() * visible.length)] : topic;
      const studied = topic ? lastStudied(app.data).get(topic.id) : undefined;
      const card = shown
        ? h(
            "div",
            { class: `topic-card${rolling > 0 ? " rolling" : ""}` },
            h("div", { class: "dim small" }, "your topic"),
            h("div", { class: "topic-title" }, shown.title),
            rolling > 0
              ? h("div", { class: "dim" }, "shuffling…")
              : [
                  h("p", { class: "topic-question" }, shown.question),
                  shown.starters.length
                    ? h("p", { class: "dim" }, "start with: ", shown.starters.map(formatRef).join(" · "))
                    : null,
                  h("p", { class: "dim small" }, studied ? `last studied ${relativeDay(studied, app.today)}` : "you haven't studied this yet"),
                ],
          )
        : h("p", { class: "dim" }, "All topics are hidden. Open Manage topics to add or show some.");
      return h(
        "div",
        { class: "topic" },
        panel("random topic", card),
        panel(
          "what next",
          listRows(actions, nav, (a) => [h("span", {}, a.label)], (i) => actions[i].run()),
        ),
        h("p", { class: "dim small" }, `Skips topics you studied in the last ${app.data.settings.recentDays} days, and favors ones you've never studied.`),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      if (nav.handle(e, actions.length)) {
        app.render();
        return true;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") return actions[nav.index].run(), true;
      if (e.key === " " || e.key === "a") return pick(topic?.id), true;
      if (e.key === "s") return start(), true;
      if (e.key === "m") return app.push(manageTopicsScreen(app)), true;
      if (e.key === "ArrowLeft") return app.pop(), true;
      return false;
    },
  };
}

export function manageTopicsScreen(app: App): Screen {
  const nav = new ListNav();
  const all = () =>
    [...app.data.topics].sort((a, b) => Number(a.builtIn) - Number(b.builtIn) || a.title.localeCompare(b.title));

  const add = async () => {
    const title = await app.prompt("New topic", "", "e.g. Being a good listener");
    if (!title) return;
    const question = (await app.prompt("A question to start with (optional, esc to skip)", "")) ?? "";
    app.update((d) => d.topics.push({ id: newId(), title, question, starters: [], builtIn: false, hidden: false }));
    nav.index = all().findIndex((t) => t.title === title);
    app.render();
    app.flash(`Added "${title}".`);
  };

  const edit = async (t: Topic) => {
    if (t.builtIn) {
      app.flash("Built-in topics can be hidden (h) but not edited. Add your own with a.");
      return;
    }
    const title = await app.prompt("Topic", t.title);
    if (!title) return;
    const question = (await app.prompt("Question (optional)", t.question)) ?? t.question;
    app.update(() => {
      t.title = title;
      t.question = question;
    });
  };

  const remove = async (t: Topic) => {
    if (t.builtIn) {
      toggleHidden(t);
      return;
    }
    if (!(await app.confirm(`Remove your topic "${t.title}"?`, "Remove", "Keep"))) return;
    app.update((d) => (d.topics = d.topics.filter((x) => x.id !== t.id)));
  };

  const toggleHidden = (t: Topic) => {
    app.update(() => (t.hidden = !t.hidden));
    app.flash(t.hidden ? `"${t.title}" won't be suggested.` : `"${t.title}" is back in the mix.`);
  };

  return {
    section: "topic",
    title: "manage topics",
    hints: () => [
      { key: "↑↓", label: "move" },
      { key: "a", label: "add" },
      { key: "⏎", label: "edit" },
      { key: "h", label: "hide/show" },
      { key: "d", label: "remove" },
    ],
    render() {
      const list = all();
      nav.clamp(list.length);
      const mine = list.filter((t) => !t.builtIn).length;
      return panel(
        `topics · ${mine} yours · ${list.length - mine} built in`,
        listRows(
          list,
          nav,
          (t) => [
            h("span", { class: t.hidden ? "dim mark" : "ok mark" }, t.hidden ? "○" : "●"),
            h("span", { class: `grow${t.hidden ? " dim strike" : ""}` }, t.title),
            h("span", { class: "dim" }, t.builtIn ? "built in" : "yours"),
          ],
          (i) => void edit(list[i]),
        ),
      );
    },
    mounted: scrollSelected,
    onKey(e) {
      if (e.metaKey || e.ctrlKey) return false;
      const list = all();
      if (nav.handle(e, list.length)) {
        app.render();
        return true;
      }
      const t = list[nav.index];
      switch (e.key) {
        case "a":
        case "n":
          void add();
          return true;
        case "Enter":
          if (t) void edit(t);
          return true;
        case "h":
        case " ":
          if (t) toggleHidden(t);
          return true;
        case "d":
        case "Delete":
          if (t) void remove(t);
          return true;
        case "ArrowLeft":
          app.pop();
          return true;
      }
      return false;
    },
  };
}
