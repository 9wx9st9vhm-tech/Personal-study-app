# Personal Study App — Planning Document

A desktop app for personal Bible study: organized study notes, a random topic picker for sessions without a plan, and a weekly to-do list for meeting preparation.

**Status:** Version 1 built (14 Nov 2026). Apple Calendar and AI are still to come. See README.md for how to run it.

## Decisions so far

- **Platform:** Desktop app, Mac only
- **Language and framework:** Tauri with TypeScript for the interface, and a small amount of Rust underneath. You're learning as we build, so code should stay readable and well commented.
- **Storage:** This device only, with export and backup to a file
- **Weekly to-do:** Recurring templates. You set your routine once, the app creates the tasks each week, and you add the specific chapters or articles. Nothing is pulled from jw.org, so there's no conflict with its Terms of Use.
- **Random topic:** Skips recently studied topics and favors ones not yet covered
- **Apple Calendar:** Later, not version 1. One-way, Calendar → To-do. The app reads only a dedicated meeting-parts calendar.
- **Topics:** A built-in starter list plus your own topics. No categories.
- **Scriptures:** Stored as references only. Each one links to the verse in the New World Translation (JW Library or wol.jw.org). No verse text is stored in the app.
- **Version 1 extras:** Study history with a habit tracker, and a Bible reading tracker
- **AI:** Not in version 1, but the design leaves a slot for Claude or a local LLM

---

## Feature 1 — Study Notes

Each study project has a title, related scriptures and notes.

- [x] Create a study project (title, date started)
- [x] Related scriptures list: add, remove and reorder references, for example "Philippians 4:6, 7"
- [x] Check that each reference is a real book, chapter and verse
- [x] Each reference opens the verse in the NWT, on jw.org or in the JW Library app (a setting). Uses jw.org's share-link format, which isn't officially documented.
- [x] Notes field
- [x] Edit or delete a project
- [x] View all projects
- [x] Search projects by title, scripture or note text
- [x] Mark a project as "in progress" or "finished"
- [x] Export or back up notes to a file
- [x] **AI slot (later):** each note page has an Assistant panel, empty until an AI is connected

## Feature 2 — Random Topic Button

For sessions when you don't have a subject in mind.

- [x] A button that suggests a topic
- [x] Skip topics studied recently (the length of "recently" is a setting)
- [x] Favor topics never studied
- [x] "Give me another" (reroll)
- [x] "Start studying this" creates a new Study Notes project from the topic
- [x] Record what was picked and when
- [x] Built-in starter list of Bible topics
- [x] Add, edit and remove your own topics
- [x] Turn off any built-in topic you don't want suggested

## Feature 3 — Weekly To-Do

- [x] Recurring task templates, for example:
  - Midweek meeting preparation
  - Watchtower Study preparation
  - Weekly Bible reading
  - Personal study session
- [x] A new week's list is generated automatically each week
- [x] Each task has an optional detail field (chapters, article title)
- [x] Check items off
- [x] Add one-off tasks for just this week
- [x] Unfinished tasks: carry them over or let them drop (setting)
- [x] Choose the day the week starts (to match meeting days)

## Feature 3b — Apple Calendar: Meeting Parts (later, not version 1)

Your meeting parts arrive in Apple Calendar from a congregation scheduling app. The app reads them and adds them to the weekly to-do list. It never writes to your calendar.

- [ ] Ask for calendar permission (macOS prompts once)
- [ ] You choose which calendar to read (the dedicated meeting-parts calendar)
- [ ] Read upcoming events from that calendar only
- [ ] Each part becomes a to-do item in the week it falls in, with its date and title
- [ ] Optional prep task ahead of the part (how many days before is a setting)
- [ ] Re-check for new or changed parts when the app opens
- [ ] If a part is moved or removed in the calendar, update or remove its to-do
- [ ] Don't create duplicates when the same part is read again
- [ ] **Source:** NW Publisher (the publisher app for NW Scheduler). How it puts assignments on the calendar is not confirmed yet: a subscribed calendar, events added one at a time, or something else.
- [ ] **Needs from you:** which calendar the parts appear under in Apple Calendar, and a few example event titles, so the app can tell part types apart (for example a Bible reading versus a talk)

## Feature 3c — Study History and Habit Tracker

- [x] Log each study session automatically (date, topic or project)
- [x] View past sessions
- [x] Feeds the random topic button's "studied recently" check
- [x] Habit tracker: a record of which days you used the app (no streak count)
- [x] A day is checked off automatically when you start a note page that day
- [x] Only one check-off per day
- [x] Days are counted by your Mac's local date and time

## Feature 3d — Bible Reading Tracker

- [x] All 66 books and 1,189 chapters, checked off chapter by chapter
- [x] Progress per book and overall
- [x] Date each chapter was read
- [x] Kept separate from the weekly to-do; chapters are marked in the tracker only

## Feature 4 — AI Plug-in Slot (later, not version 1)

The goal is that AI can be added later without reworking the app.

- [x] One internal "assistant" interface that any provider can plug into (src/ai.ts)
- [ ] Provider options: Claude (API key) or a local LLM (for example Ollama or LM Studio)
- [ ] Possible uses: suggest related scriptures, summarize notes, generate questions to think about
- [x] AI is off by default; notes never leave the device unless a cloud provider is turned on

## Feature 5 — Foundation

- [x] Desktop framework chosen: Tauri + TypeScript
- [ ] Apple Calendar (later) will need a small Swift add-on, because Tauri can't reach Calendar directly
- [x] Local storage: one JSON data file, written safely, with 14 daily backups
- [x] Backup and restore

---

## User Interface

Defined by you. Anything not written here is still open; nothing has been assumed.

**Your ideas so far:**
- Terminal-based design: a text-based UI with some personality
- Looks complex but is actually pretty intuitive
- Arrow keys work everywhere, so a mouse is never needed
- Keyboard first, mouse optional: clicking also works for people who want it
- Runs as its own Mac app window (with a Dock icon) styled like a terminal, not inside Terminal or iTerm

- [x] UI ideas captured
- [x] First version of every screen built by Claude, yours to change: amber/green/ice/paper themes, ASCII logo, start-up animation, optional scanlines

## Open questions

1. **Anything else** to plan for?
