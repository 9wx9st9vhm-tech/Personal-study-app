// Books of the Bible, in order, with the number of verses in each chapter.
// Verse counts use the standard English verse numbering (31,102 verses in
// 1,189 chapters), counted from the public-domain King James Version data
// published by the CrossWire Bible Society. English Bibles, including the
// New World Translation, follow this numbering almost everywhere; it is only
// used here to check that a reference like "John 3:16" really exists.

export interface Book {
  /** 1-66, the number jw.org uses in its links. */
  num: number;
  name: string;
  /** The abbreviation used in New World Translation publications. */
  abbr: string;
  /** Other spellings people type (lowercase, no spaces or periods). */
  aliases: string[];
  /** verses[0] is the number of verses in chapter 1, and so on. */
  verses: number[];
}

export const BOOKS: Book[] = [
  { num: 1, name: "Genesis", abbr: "Ge", aliases: ["gen", "gn"], verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { num: 2, name: "Exodus", abbr: "Ex", aliases: ["exo", "exod"], verses: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { num: 3, name: "Leviticus", abbr: "Le", aliases: ["lev", "lv"], verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34] },
  { num: 4, name: "Numbers", abbr: "Nu", aliases: ["num", "nm"], verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { num: 5, name: "Deuteronomy", abbr: "De", aliases: ["deut", "dt"], verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
  { num: 6, name: "Joshua", abbr: "Jos", aliases: ["josh"], verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { num: 7, name: "Judges", abbr: "Jg", aliases: ["judg", "jdg"], verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { num: 8, name: "Ruth", abbr: "Ru", aliases: ["rth"], verses: [22,23,18,22] },
  { num: 9, name: "1 Samuel", abbr: "1Sa", aliases: ["1sam", "1sm"], verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { num: 10, name: "2 Samuel", abbr: "2Sa", aliases: ["2sam", "2sm"], verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { num: 11, name: "1 Kings", abbr: "1Ki", aliases: ["1kgs", "1kin", "1kg"], verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { num: 12, name: "2 Kings", abbr: "2Ki", aliases: ["2kgs", "2kin", "2kg"], verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { num: 13, name: "1 Chronicles", abbr: "1Ch", aliases: ["1chr", "1chron"], verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { num: 14, name: "2 Chronicles", abbr: "2Ch", aliases: ["2chr", "2chron"], verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { num: 15, name: "Ezra", abbr: "Ezr", aliases: [], verses: [11,70,13,24,17,22,28,36,15,44] },
  { num: 16, name: "Nehemiah", abbr: "Ne", aliases: ["neh"], verses: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { num: 17, name: "Esther", abbr: "Es", aliases: ["est", "esth"], verses: [22,23,15,17,14,14,10,17,32,3] },
  { num: 18, name: "Job", abbr: "Job", aliases: [], verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { num: 19, name: "Psalms", abbr: "Ps", aliases: ["psa", "psalm", "pss", "psm"], verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6] },
  { num: 20, name: "Proverbs", abbr: "Pr", aliases: ["prov", "prv"], verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { num: 21, name: "Ecclesiastes", abbr: "Ec", aliases: ["eccl", "ecc", "qoh"], verses: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { num: 22, name: "Song of Solomon", abbr: "Ca", aliases: ["song", "sos", "songofsongs", "canticles", "sng"], verses: [17,17,11,16,16,13,13,14] },
  { num: 23, name: "Isaiah", abbr: "Isa", aliases: ["is"], verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
  { num: 24, name: "Jeremiah", abbr: "Jer", aliases: [], verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { num: 25, name: "Lamentations", abbr: "La", aliases: ["lam"], verses: [22,22,66,22,22] },
  { num: 26, name: "Ezekiel", abbr: "Eze", aliases: ["ezek", "ezk"], verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
  { num: 27, name: "Daniel", abbr: "Da", aliases: ["dan", "dn"], verses: [21,49,30,37,31,28,28,27,27,21,45,13] },
  { num: 28, name: "Hosea", abbr: "Ho", aliases: ["hos"], verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { num: 29, name: "Joel", abbr: "Joe", aliases: [], verses: [20,32,21] },
  { num: 30, name: "Amos", abbr: "Am", aliases: ["amo"], verses: [15,16,15,13,27,14,17,14,15] },
  { num: 31, name: "Obadiah", abbr: "Ob", aliases: ["obad", "oba"], verses: [21] },
  { num: 32, name: "Jonah", abbr: "Jon", aliases: ["jnh"], verses: [17,10,10,11] },
  { num: 33, name: "Micah", abbr: "Mic", aliases: [], verses: [16,13,12,13,15,16,20] },
  { num: 34, name: "Nahum", abbr: "Na", aliases: ["nah"], verses: [15,13,19] },
  { num: 35, name: "Habakkuk", abbr: "Hab", aliases: [], verses: [17,20,19] },
  { num: 36, name: "Zephaniah", abbr: "Zep", aliases: ["zeph"], verses: [18,15,20] },
  { num: 37, name: "Haggai", abbr: "Hag", aliases: [], verses: [15,23] },
  { num: 38, name: "Zechariah", abbr: "Zec", aliases: ["zech"], verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { num: 39, name: "Malachi", abbr: "Mal", aliases: [], verses: [14,17,18,6] },
  { num: 40, name: "Matthew", abbr: "Mt", aliases: ["matt", "mat"], verses: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { num: 41, name: "Mark", abbr: "Mr", aliases: ["mk", "mrk"], verses: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { num: 42, name: "Luke", abbr: "Lu", aliases: ["lk"], verses: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { num: 43, name: "John", abbr: "Joh", aliases: ["jn", "jhn"], verses: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
  { num: 44, name: "Acts", abbr: "Ac", aliases: ["act"], verses: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31] },
  { num: 45, name: "Romans", abbr: "Ro", aliases: ["rom", "rm"], verses: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { num: 46, name: "1 Corinthians", abbr: "1Co", aliases: ["1cor"], verses: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24] },
  { num: 47, name: "2 Corinthians", abbr: "2Co", aliases: ["2cor"], verses: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { num: 48, name: "Galatians", abbr: "Ga", aliases: ["gal"], verses: [24,21,29,31,26,18] },
  { num: 49, name: "Ephesians", abbr: "Eph", aliases: [], verses: [23,22,21,32,33,24] },
  { num: 50, name: "Philippians", abbr: "Php", aliases: ["phil", "phi"], verses: [30,30,21,23] },
  { num: 51, name: "Colossians", abbr: "Col", aliases: [], verses: [29,23,25,18] },
  { num: 52, name: "1 Thessalonians", abbr: "1Th", aliases: ["1thess", "1thes"], verses: [10,20,13,18,28] },
  { num: 53, name: "2 Thessalonians", abbr: "2Th", aliases: ["2thess", "2thes"], verses: [12,17,18] },
  { num: 54, name: "1 Timothy", abbr: "1Ti", aliases: ["1tim"], verses: [20,15,16,16,25,21] },
  { num: 55, name: "2 Timothy", abbr: "2Ti", aliases: ["2tim"], verses: [18,26,17,22] },
  { num: 56, name: "Titus", abbr: "Tit", aliases: [], verses: [16,15,15] },
  { num: 57, name: "Philemon", abbr: "Phm", aliases: ["philem", "phlm"], verses: [25] },
  { num: 58, name: "Hebrews", abbr: "Heb", aliases: [], verses: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { num: 59, name: "James", abbr: "Jas", aliases: ["jam", "jms"], verses: [27,26,18,17,20] },
  { num: 60, name: "1 Peter", abbr: "1Pe", aliases: ["1pet", "1pt"], verses: [25,25,22,19,14] },
  { num: 61, name: "2 Peter", abbr: "2Pe", aliases: ["2pet", "2pt"], verses: [21,22,18] },
  { num: 62, name: "1 John", abbr: "1Jo", aliases: ["1jn", "1joh"], verses: [10,29,24,21,21] },
  { num: 63, name: "2 John", abbr: "2Jo", aliases: ["2jn", "2joh"], verses: [13] },
  { num: 64, name: "3 John", abbr: "3Jo", aliases: ["3jn", "3joh"], verses: [14] },
  { num: 65, name: "Jude", abbr: "Jude", aliases: ["jud"], verses: [25] },
  { num: 66, name: "Revelation", abbr: "Re", aliases: ["rev", "rv", "revelations"], verses: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] },
];

/** Books 1-39 are the Hebrew Scriptures; 40-66 the Christian Greek Scriptures. */
export const FIRST_GREEK_BOOK = 40;

export const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.verses.length, 0);
