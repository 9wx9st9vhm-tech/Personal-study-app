# Personal Study

A Mac app for personal Bible study, with a keyboard-driven terminal look.

- **Study notes:** a title, related scriptures and notes for each project. Each scripture opens in the New World Translation on jw.org or in JW Library.
- **Random topic:** suggests a subject when you don't have one in mind. It skips topics you studied recently and favors ones you've never studied.
- **Weekly to-do:** your recurring tasks (meeting preparation, Bible reading and so on) appear on their own each week.
- **Habit tracker:** a day is checked off when you open a note page.
- **Bible reading tracker:** all 66 books, checked off chapter by chapter.
- **History:** every study session, and your habit calendar.

Everything is saved on your Mac. Nothing is sent anywhere.

## Running it on your Mac

**The easy way:** open Terminal (⌘ Space, type "Terminal") and paste this one line:

```sh
curl -fsSL https://raw.githubusercontent.com/9wx9st9vhm-tech/Personal-study-app/claude/serene-knuth-6ljbl9/setup-mac.sh | bash
```

It installs everything the app needs, builds it, puts it in your Applications folder and opens it. The first run takes 10–20 minutes. Run the same line again later to update. You can read [`setup-mac.sh`](setup-mac.sh) first to see exactly what it does.

**By hand,** if you'd rather do each step yourself:

1. **Install Apple's developer tools.** Open Terminal and run:
   ```sh
   xcode-select --install
   ```
2. **Install Node.js** (the LTS version) from https://nodejs.org.
3. **Install Rust.** In Terminal, run the following and accept the defaults:
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
   Close Terminal and open it again afterwards.
4. **Get the code and install its packages:**
   ```sh
   git clone --branch claude/serene-knuth-6ljbl9 https://github.com/9wx9st9vhm-tech/Personal-study-app.git
   cd Personal-study-app
   npm install
   ```

Then you have two ways to use it:

- **Try it:** run `npm run app`. The first start takes a few minutes while Rust compiles, and later starts are quick.
- **Install it:** run `npm run app:build`. The finished app appears in `src-tauri/target/release/bundle/macos/Personal Study.app`. Drag it into your Applications folder.

Because you built the app yourself and it isn't signed by Apple, macOS may say it "can't be opened." The first time, right-click the app, choose **Open**, then confirm.

## Keys

The mouse works, but you never need it. Press `?` in the app to see every key.

| Key | Does |
|---|---|
| `1`–`7` | Home, Notes, Topic, Week, Reading, History, Settings |
| `↑` `↓` | move |
| `Enter` or `→` | open or choose |
| `Esc` or `←` | back |
| `n` | new note |
| `/` | search notes |
| `Space` | check a task, mark a chapter, or show another topic |

On a note page, `↑` `↓` (or `Tab`) move between the title, status, scriptures, notes and delete button. Text boxes take typing directly. Type scriptures the way you'd write them, like `Phil 4:6, 7; Ps 55:22`.

## Where your data is

| What | Where |
|---|---|
| Your data | `~/Library/Application Support/com.personalstudy.desktop/study-data.json` |
| Daily automatic backups (last 14 days) | `…/com.personalstudy.desktop/backups/` |
| Backups you export from Settings | `~/Documents/Personal Study Backups/` |

To restore a backup, go to **Settings → Restore from a backup**. The app saves a copy of your current data first.

## About the scripture links

Links use the format jw.org uses in its own share links, for example `https://www.jw.org/finder?bible=43003016` for John 3:16. jw.org doesn't officially document this format, so it could change. If links stop working, the code to update is `refLink` in `src/scripture.ts`. The **JW Library app** option in Settings uses `jwlibrary:///finder?bible=…` and only works if JW Library is installed on the Mac.

The app stores references only. No Bible text is copied into it.

## How the code is organized

The interface is TypeScript in `src/`. The small Mac-side part is Rust in `src-tauri/`, and it only saves and loads files.

| File | What it does |
|---|---|
| `src/main.ts` | starts the app and runs the start-up animation |
| `src/app.ts` | the frame, key handling, saving, and pop-up dialogs |
| `src/screens/*.ts` | one file per screen |
| `src/scripture.ts` | reads references like "Phil 4:6, 7", checks them, and builds links |
| `src/topics.ts` | built-in topics and the rules for picking one |
| `src/week.ts` | creates each week's to-do list from your templates |
| `src/model.ts` | the shape of everything that gets saved |
| `src/ai.ts` | the reserved slot for adding Claude or a local AI later |
| `src/styles.css` | the terminal look and the four color themes |
| `src-tauri/src/lib.rs` | saving, loading, and backups on the Mac |

Useful commands:

```sh
npm run dev     # the interface in a web browser at http://localhost:1420 (data kept in the browser)
npm test        # checks scripture parsing, topic picking and weekly lists
npm run check   # TypeScript type check
```
