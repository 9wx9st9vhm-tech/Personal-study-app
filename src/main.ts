// Starting point: create the app, register every screen, and run the short
// start-up animation.

import "./styles.css";
import { App } from "./app";
import { h } from "./ui/dom";
import { currentWeekStart, findWeek, progress } from "./week";
import { homeScreen } from "./screens/home";
import { notesScreen } from "./screens/notes";
import { topicScreen } from "./screens/topic";
import { weekScreen } from "./screens/week";
import { readingScreen } from "./screens/reading";
import { historyScreen } from "./screens/history";
import { settingsScreen } from "./screens/settings";
import { helpScreen } from "./screens/help";

const root = document.getElementById("app")!;
const app = new App(root);
app.register("home", homeScreen);
app.register("notes", notesScreen);
app.register("topic", topicScreen);
app.register("week", weekScreen);
app.register("reading", readingScreen);
app.register("history", historyScreen);
app.register("settings", settingsScreen);
app.registerHelp(helpScreen);

/** Type out a few status lines, like a terminal starting up. Any key skips. */
async function boot(): Promise<void> {
  const d = app.data;
  const wk = progress(findWeek(d, currentWeekStart(d, app.today)));
  const lines = [
    "personal study v0.1",
    `loading notes ........ ${d.projects.length} saved`,
    `loading topics ....... ${d.topics.filter((t) => !t.hidden).length} ready`,
    `this week ............ ${wk.done}/${wk.total} done`,
    `bible reading ........ ${Object.keys(d.reading).length} chapters`,
    "ready.",
  ];
  const screen = h("pre", { class: "boot" });
  root.replaceChildren(h("div", { class: "frame boot-frame" }, screen));
  let skip = false;
  const onKey = () => (skip = true);
  window.addEventListener("keydown", onKey, { once: true });
  window.addEventListener("mousedown", onKey, { once: true });
  for (const line of lines) {
    if (skip) break;
    screen.textContent += `> ${line}\n`;
    await new Promise((r) => setTimeout(r, 140));
  }
  if (!skip) await new Promise((r) => setTimeout(r, 250));
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("mousedown", onKey);
}

void (async () => {
  await app.start();
  if (app.data.settings.bootAnimation && !new URLSearchParams(location.search).has("noboot")) {
    app.booting = true;
    await boot();
    app.booting = false;
    app.render();
  }
})();
