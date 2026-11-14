// The random topic button: the built-in starter topics and the rules for
// choosing one.

import { type Day, daysBetween } from "./dates";
import type { AppData, Topic } from "./model";
import { ref } from "./scripture";

// [id, title, question, starting scriptures]
const STARTERS: [string, string, string, string[]][] = [
  ["prayer", "Prayer", "How does Jehovah want me to pray, and how does he answer?", ["Philippians 4:6, 7", "Psalm 65:2", "1 John 5:14"]],
  ["gods-love", "Jehovah's love", "How has Jehovah shown his love, and how can I feel it more?", ["1 John 4:8", "John 3:16", "Romans 8:38, 39"]],
  ["gods-name", "Jehovah's name", "Why does God's name matter, and what does it tell me about him?", ["Psalm 83:18", "Exodus 3:15", "Matthew 6:9"]],
  ["kingdom", "God's Kingdom", "What is the Kingdom, and what will it do?", ["Daniel 2:44", "Matthew 6:10", "Revelation 11:15"]],
  ["anxiety", "Dealing with anxiety", "What does the Bible say to do with my worries?", ["Philippians 4:6, 7", "1 Peter 5:7", "Matthew 6:34"]],
  ["forgiveness", "Forgiveness", "How does Jehovah forgive, and how can I forgive others?", ["Colossians 3:13", "Psalm 86:5", "Matthew 6:14, 15"]],
  ["humility", "Humility", "What does humility look like day to day?", ["Micah 6:8", "Philippians 2:3", "James 4:6"]],
  ["patience", "Patience", "Why is patience worth working on?", ["Ecclesiastes 7:8", "2 Peter 3:9", "Galatians 5:22, 23"]],
  ["ransom", "The ransom", "What did the ransom accomplish, and what does it mean for me?", ["Matthew 20:28", "1 Timothy 2:5, 6", "John 3:16"]],
  ["resurrection", "The resurrection hope", "What does the Bible promise about the dead coming back?", ["John 5:28, 29", "Acts 24:15", "John 11:25"]],
  ["paradise", "Paradise on earth", "What will life be like on a paradise earth?", ["Psalm 37:29", "Revelation 21:3, 4", "Isaiah 65:21, 22"]],
  ["dead", "The condition of the dead", "What happens when we die?", ["Ecclesiastes 9:5, 10", "Psalm 146:4", "John 11:11-14"]],
  ["suffering", "Why God permits suffering", "Where does suffering come from, and how will it end?", ["James 1:13", "1 John 5:19", "Revelation 21:4"]],
  ["last-days", "The last days", "How do world events fit Bible prophecy?", ["2 Timothy 3:1-5", "Matthew 24:7", "Matthew 24:14"]],
  ["jesus", "Jesus' role", "Why is Jesus central to Jehovah's purpose?", ["John 14:6", "Acts 4:12", "Philippians 2:9-11"]],
  ["holy-spirit", "Holy spirit", "How does Jehovah's spirit help me?", ["Luke 11:13", "Acts 1:8", "Galatians 5:22, 23"]],
  ["preaching", "The preaching work", "Why do we preach, and how can I find more joy in it?", ["Matthew 24:14", "Matthew 28:19, 20", "Acts 20:20"]],
  ["prophecies-jesus", "Prophecies about Jesus", "Which prophecies did Jesus fulfill?", ["Micah 5:2", "Isaiah 53:5", "Zechariah 9:9"]],
  ["justice", "Jehovah's justice", "How is Jehovah always fair?", ["Deuteronomy 32:4", "Psalm 37:28", "Acts 10:34, 35"]],
  ["power", "Jehovah's power", "How does Jehovah use his power, and for whom?", ["Isaiah 40:26", "Isaiah 40:29", "Jeremiah 32:17"]],
  ["mercy", "Jehovah's mercy", "How does Jehovah show mercy, and how can I imitate it?", ["Psalm 103:13, 14", "Exodus 34:6", "Luke 6:36"]],
  ["wisdom", "Wisdom", "How do I get godly wisdom?", ["James 1:5", "Proverbs 2:6", "Proverbs 9:10"]],
  ["faith", "Faith", "What is real faith, and how does it grow?", ["Hebrews 11:1, 6", "Romans 10:17", "James 2:26"]],
  ["endurance", "Endurance", "What helps me keep going when it's hard?", ["James 1:12", "Hebrews 12:1", "Matthew 24:13"]],
  ["courage", "Courage", "Where does courage come from?", ["Joshua 1:9", "Isaiah 41:10", "Psalm 27:14"]],
  ["joy", "Joy", "How can I keep my joy?", ["Philippians 4:4", "Nehemiah 8:10", "Galatians 5:22"]],
  ["peace", "Peace", "How do I find peace inside and with others?", ["Philippians 4:7", "Isaiah 26:3", "Romans 12:18"]],
  ["self-control", "Self-control", "How can I build self-control?", ["Galatians 5:22, 23", "Proverbs 25:28", "1 Corinthians 9:25"]],
  ["kindness", "Kindness", "What does kindness look like in practice?", ["Ephesians 4:32", "Proverbs 19:17", "Micah 6:8"]],
  ["honesty", "Honesty", "Why does honesty matter to Jehovah?", ["Hebrews 13:18", "Ephesians 4:25", "Proverbs 12:22"]],
  ["neighbor", "Love for neighbor", "Who is my neighbor, and how do I show love?", ["Matthew 22:39", "Luke 10:27", "Romans 13:10"]],
  ["loyalty", "Loyalty", "What does it mean to be loyal to Jehovah and to others?", ["Psalm 18:25", "Ruth 1:16", "Proverbs 18:24"]],
  ["modesty", "Modesty", "What is modesty, and why does it matter?", ["Micah 6:8", "Proverbs 11:2", "1 Timothy 2:9"]],
  ["contentment", "Contentment", "How can I be content with what I have?", ["1 Timothy 6:6-8", "Hebrews 13:5", "Philippians 4:11"]],
  ["gratitude", "Gratitude", "How can I show I'm thankful?", ["Colossians 3:15", "1 Thessalonians 5:18", "Psalm 100:4"]],
  ["generosity", "Generosity", "Why does giving bring happiness?", ["Acts 20:35", "2 Corinthians 9:7", "Proverbs 11:25"]],
  ["speech", "Upbuilding speech", "How can my words build others up?", ["Ephesians 4:29", "Colossians 4:6", "Proverbs 15:1"]],
  ["friends", "Choosing friends", "What makes a good friend?", ["Proverbs 13:20", "Proverbs 17:17", "1 Corinthians 15:33"]],
  ["marriage", "Marriage", "What makes a marriage strong?", ["Genesis 2:24", "Ephesians 5:33", "Colossians 3:18, 19"]],
  ["family", "Family and parenting", "How can a family put Jehovah first?", ["Deuteronomy 6:6, 7", "Ephesians 6:4", "Proverbs 22:6"]],
  ["discouragement", "Dealing with discouragement", "What does Jehovah say to the discouraged?", ["Psalm 34:18", "Isaiah 40:31", "2 Corinthians 4:16"]],
  ["grief", "Coping with loss", "How does Jehovah comfort those who are grieving?", ["John 11:35", "2 Corinthians 1:3, 4", "Psalm 147:3"]],
  ["meditation", "Bible study and meditation", "How can I get more out of personal study?", ["Psalm 1:2, 3", "Joshua 1:8", "2 Timothy 3:16, 17"]],
  ["abraham", "Bible character: Abraham", "What made Abraham's faith so strong?", ["Genesis 12:1-4", "Hebrews 11:8-10", "James 2:23"]],
  ["noah", "Bible character: Noah", "How did Noah stay faithful in a violent world?", ["Genesis 6:9", "Genesis 6:22", "Hebrews 11:7"]],
  ["joseph", "Bible character: Joseph", "How did Joseph handle injustice?", ["Genesis 39:9", "Genesis 45:5", "Genesis 50:20"]],
  ["moses", "Bible character: Moses", "What can I learn from Moses' meekness?", ["Numbers 12:3", "Exodus 4:10-12", "Hebrews 11:24-27"]],
  ["ruth", "Bible character: Ruth", "What does Ruth teach about loyal love?", ["Ruth 1:16, 17", "Ruth 2:12", "Ruth 3:11"]],
  ["hannah", "Bible character: Hannah", "How did Hannah deal with her distress?", ["1 Samuel 1:10, 11", "1 Samuel 1:27", "1 Samuel 2:1"]],
  ["david", "Bible character: David", "What can I learn from David's courage and repentance?", ["1 Samuel 17:45", "Psalm 51:10", "Acts 13:22"]],
  ["esther", "Bible character: Esther", "Where did Esther find courage?", ["Esther 4:14", "Esther 4:16", "Esther 7:3"]],
  ["job", "Bible character: Job", "What kept Job faithful through loss?", ["Job 1:21", "Job 42:10", "James 5:11"]],
  ["daniel", "Bible character: Daniel", "How did Daniel keep his integrity in Babylon?", ["Daniel 1:8", "Daniel 6:10", "Daniel 6:22"]],
  ["mary", "Bible character: Mary", "What does Mary's example teach about humility?", ["Luke 1:38", "Luke 1:46, 47", "Luke 2:19"]],
  ["peter", "Bible character: Peter", "How did Peter recover from his mistakes?", ["Matthew 14:28-31", "Luke 22:61, 62", "John 21:15-17"]],
  ["paul", "Bible character: Paul", "What kept Paul going to the end?", ["Acts 9:15", "Philippians 3:13, 14", "2 Timothy 4:7"]],
];

export const BUILT_IN_TOPICS: Topic[] = STARTERS.map(([id, title, question, starters]) => ({
  id: `builtin:${id}`,
  title,
  question,
  starters: starters.map(ref),
  builtIn: true,
  hidden: false,
}));

/** A short reference shown on the home screen each day. */
export const DAILY_REFERENCES: string[] = [
  "Psalm 55:22", "Isaiah 41:10", "Proverbs 3:5, 6", "Philippians 4:13", "Psalm 37:5",
  "Matthew 6:33", "Romans 8:28", "Psalm 34:18", "Isaiah 40:31", "Joshua 1:9",
  "Psalm 23:1-4", "John 17:3", "James 4:8", "1 Peter 5:7", "Psalm 145:18",
  "Lamentations 3:22, 23", "Zephaniah 3:17", "Hebrews 6:10", "Psalm 139:14", "Micah 6:8",
  "2 Corinthians 4:16-18", "Romans 15:4", "Psalm 119:105", "Proverbs 18:10", "Isaiah 30:21",
  "Matthew 11:28-30", "1 John 4:19", "Psalm 16:8", "Galatians 6:9", "Revelation 21:4",
];

export function dailyReference(day: Day): string {
  // The same reference all day, a different one tomorrow.
  const n = daysBetween("2026-01-01", day);
  return DAILY_REFERENCES[((n % DAILY_REFERENCES.length) + DAILY_REFERENCES.length) % DAILY_REFERENCES.length];
}

/**
 * The last day you studied each topic. A topic counts as studied when a
 * project was started from it, or when a project has the same title.
 */
export function lastStudied(data: AppData): Map<string, Day> {
  const byTitle = new Map(data.topics.map((t) => [t.title.toLowerCase(), t.id]));
  const projectTopic = new Map<string, string>();
  for (const p of data.projects) {
    const topicId = p.topicId ?? byTitle.get(p.title.trim().toLowerCase());
    if (topicId) projectTopic.set(p.id, topicId);
  }
  const last = new Map<string, Day>();
  const mark = (topicId: string, day: Day) => {
    const prev = last.get(topicId);
    if (!prev || day > prev) last.set(topicId, day);
  };
  for (const p of data.projects) {
    const t = projectTopic.get(p.id);
    if (t) mark(t, p.createdAt);
  }
  for (const s of data.sessions) {
    const t = projectTopic.get(s.projectId);
    if (t) mark(t, s.day);
  }
  return last;
}

/**
 * Choose a topic. Skips hidden topics and ones studied in the last
 * `recentDays` days, and makes never-studied topics three times as likely.
 * If everything was studied recently, falls back to the least recent.
 */
export function pickTopic(
  data: AppData,
  now: Day,
  options: { exclude?: string; random?: () => number } = {},
): Topic | null {
  const random = options.random ?? Math.random;
  const studied = lastStudied(data);
  const visible = data.topics.filter((t) => !t.hidden && t.id !== options.exclude);
  if (visible.length === 0) {
    return data.topics.find((t) => !t.hidden) ?? null;
  }
  const fresh = visible.filter((t) => {
    const d = studied.get(t.id);
    return !d || daysBetween(d, now) >= data.settings.recentDays;
  });
  if (fresh.length === 0) {
    return [...visible].sort((a, b) => (studied.get(a.id) ?? "").localeCompare(studied.get(b.id) ?? ""))[0];
  }
  const weights = fresh.map((t) => (studied.has(t.id) ? 1 : 3));
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < fresh.length; i++) {
    roll -= weights[i];
    if (roll < 0) return fresh[i];
  }
  return fresh[fresh.length - 1];
}
