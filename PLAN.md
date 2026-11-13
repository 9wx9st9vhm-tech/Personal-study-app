# Personal Study App — Planning Document

A desktop app for personal Bible study: organized study notes, a random topic picker for sessions without a plan, and a weekly to-do list for meeting preparation.

**Status:** Planning. Nothing is built yet.

## Decisions so far

- **Platform:** Desktop app
- **Storage:** This device only, with export and backup to a file
- **Weekly to-do:** Recurring templates. You set your routine once, the app creates the tasks each week, and you add the specific chapters or articles. Nothing is pulled from jw.org, so there's no conflict with its Terms of Use.
- **Random topic:** Skips recently studied topics and favors ones not yet covered
- **AI:** Not in version 1, but the design leaves a slot for Claude or a local LLM

---

## Feature 1 — Study Notes

Each study project has a title, related scriptures and notes.

- [ ] Create a study project (title, date started)
- [ ] Related scriptures list: add, remove and reorder references, for example "Philippians 4:6, 7"
- [ ] Notes area with basic formatting
- [ ] Edit or delete a project
- [ ] List all projects, newest first
- [ ] Search projects by title, scripture or note text
- [ ] Tags or categories (optional, also used by the random topic picker)
- [ ] Mark a project as "in progress" or "finished"
- [ ] Export or back up notes to a file
- [ ] **AI slot (later):** an empty "Assistant" panel on each project, kept out of the way until an AI provider is connected

## Feature 2 — Random Topic Button

For sessions when you don't have a subject in mind.

- [ ] One button that suggests a topic
- [ ] Skip topics studied recently (the length of "recently" is a setting)
- [ ] Favor topics never studied
- [ ] "Give me another" (reroll)
- [ ] "Start studying this" creates a new Study Notes project from the topic
- [ ] Record what was picked and when
- [ ] **Open question:** where topics come from (see below)

## Feature 3 — Weekly To-Do

- [ ] Recurring task templates, for example:
  - Midweek meeting preparation
  - Watchtower Study preparation
  - Weekly Bible reading
  - Personal study session
- [ ] A new week's list is generated automatically each week
- [ ] Each task has an optional detail field (chapters, article title)
- [ ] Check items off; progress shown for the week
- [ ] Add one-off tasks for just this week
- [ ] Unfinished tasks: carry them over or let them drop (setting)
- [ ] Choose the day the week starts (to match meeting days)

## Feature 4 — AI Plug-in Slot (later, not version 1)

The goal is that AI can be added later without reworking the app.

- [ ] One internal "assistant" interface that any provider can plug into
- [ ] Provider options: Claude (API key) or a local LLM (for example Ollama or LM Studio)
- [ ] Possible uses: suggest related scriptures, summarize notes, generate questions to think about
- [ ] AI is off by default; notes never leave the device unless a cloud provider is turned on

## Feature 5 — Foundation

- [ ] Choose a desktop framework (candidates: Tauri or Electron)
- [ ] Local database (for example SQLite)
- [ ] Backup and restore
- [ ] Simple, calm, readable design

---

## Open questions

1. **Topic sources for the random button:** a built-in starter list, your own list, or both?
2. **Scripture text:** only store references like "John 17:3", or show the verse text too? Showing text would require a Bible translation you're allowed to bundle, or pasting verses in yourself.
3. **Topic categories or mood filters,** such as "encouragement" or "something I'm dealing with": wanted or not?
4. **Mac, Windows, or both?**
5. **Where the AI panel goes:** inside each note, or a separate screen?
6. **Anything else** to plan for: reminders, study streaks, a reading tracker?
