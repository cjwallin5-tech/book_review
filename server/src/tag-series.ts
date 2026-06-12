/**
 * One-time migration: adds `series` + `series_order` columns to books
 * and tags every book that belongs to a known series.
 *
 * Safe to re-run: columns are added only if missing, updates are idempotent.
 *
 * Run with: npx tsx src/tag-series.ts
 */

import db from "./db.js";

// ── Add columns ──────────────────────────────────────────────────────────────

for (const col of ["series TEXT NOT NULL DEFAULT ''", "series_order INTEGER NOT NULL DEFAULT 0"]) {
  const name = col.split(" ")[0];
  try {
    db.prepare(`ALTER TABLE books ADD COLUMN ${col}`).run();
    console.log(`Added column: ${name}`);
  } catch {
    console.log(`Column already exists: ${name}`);
  }
}

// ── Series definitions ────────────────────────────────────────────────────────
// Each entry: { series, books: [{ match, order }] }
// match is a lowercase substring of the stored title (flexible enough for
// slight wording differences returned by Open Library).

const SERIES_DEFS: {
  series: string;
  books: { match: string; order: number }[];
}[] = [
  {
    series: "The Lord of the Rings",
    books: [
      { match: "the hobbit", order: 0 },
      { match: "fellowship of the ring", order: 1 },
      { match: "two towers", order: 2 },
      { match: "return of the king", order: 3 },
    ],
  },
  {
    series: "Harry Potter",
    books: [
      { match: "philosopher's stone", order: 1 },
      { match: "sorcerer's stone", order: 1 },
      { match: "chamber of secrets", order: 2 },
      { match: "prisoner of azkaban", order: 3 },
      { match: "goblet of fire", order: 4 },
      { match: "order of the phoenix", order: 5 },
      { match: "half-blood prince", order: 6 },
      { match: "deathly hallows", order: 7 },
    ],
  },
  {
    series: "The Hunger Games",
    books: [
      { match: "the hunger games", order: 1 },
      { match: "catching fire", order: 2 },
      { match: "mockingjay", order: 3 },
      { match: "ballad of songbirds", order: 0 },
    ],
  },
  {
    series: "Twilight",
    books: [
      { match: "twilight", order: 1 },
      { match: "new moon", order: 2 },
      { match: "eclipse", order: 3 },
      { match: "breaking dawn", order: 4 },
    ],
  },
  {
    series: "A Song of Ice and Fire",
    books: [
      { match: "game of thrones", order: 1 },
      { match: "clash of kings", order: 2 },
      { match: "storm of swords", order: 3 },
      { match: "feast for crows", order: 4 },
      { match: "dance with dragons", order: 5 },
    ],
  },
  {
    series: "The Stormlight Archive",
    books: [
      { match: "way of kings", order: 1 },
      { match: "words of radiance", order: 2 },
      { match: "oathbringer", order: 3 },
      { match: "rhythm of war", order: 4 },
    ],
  },
  {
    series: "Mistborn",
    books: [
      { match: "the final empire", order: 1 },
      { match: "mistborn", order: 1 },          // same book, different Open Library title
      { match: "well of ascension", order: 2 },
      { match: "hero of ages", order: 3 },
      { match: "alloy of law", order: 4 },
    ],
  },
  {
    series: "A Court of Thorns and Roses",
    books: [
      { match: "court of thorns and roses", order: 1 },
      { match: "court of mist and fury", order: 2 },
      { match: "court of wings and ruin", order: 3 },
      { match: "court of frost and starlight", order: 4 },
      { match: "court of silver flames", order: 5 },
    ],
  },
  {
    series: "Throne of Glass",
    books: [
      { match: "throne of glass", order: 1 },
      { match: "crown of midnight", order: 2 },
      { match: "heir of fire", order: 3 },
      { match: "queen of shadows", order: 4 },
      { match: "empire of storms", order: 5 },
      { match: "tower of dawn", order: 6 },
      { match: "kingdom of the golden sun", order: 7 },
    ],
  },
  {
    series: "Six of Crows",
    books: [
      { match: "six of crows", order: 1 },
      { match: "crooked kingdom", order: 2 },
    ],
  },
  {
    series: "Shadow and Bone",
    books: [
      { match: "shadow and bone", order: 1 },
      { match: "siege and storm", order: 2 },
      { match: "ruin and rising", order: 3 },
    ],
  },
  {
    series: "Alex Stern",
    books: [
      { match: "ninth house", order: 1 },
      { match: "hell bent", order: 2 },
    ],
  },
  {
    series: "The Empyrean",
    books: [
      { match: "fourth wing", order: 1 },
      { match: "iron flame", order: 2 },
      { match: "onyx storm", order: 3 },
    ],
  },
  {
    series: "The Poppy War",
    books: [
      { match: "the poppy war", order: 1 },
      { match: "the dragon republic", order: 2 },
      { match: "the burning god", order: 3 },
    ],
  },
  {
    series: "Red Rising",
    books: [
      { match: "red rising", order: 1 },
      { match: "golden son", order: 2 },
      { match: "morning star", order: 3 },
      { match: "iron gold", order: 4 },
      { match: "dark age", order: 5 },
      { match: "light bringer", order: 6 },
    ],
  },
  {
    series: "The Kingkiller Chronicle",
    books: [
      { match: "name of the wind", order: 1 },
      { match: "wise man's fear", order: 2 },
      { match: "doors of stone", order: 3 },
    ],
  },
  {
    series: "Divergent",
    books: [
      { match: "divergent", order: 1 },
      { match: "insurgent", order: 2 },
      { match: "allegiant", order: 3 },
    ],
  },
  {
    series: "The Maze Runner",
    books: [
      { match: "the maze runner", order: 1 },
      { match: "scorch trials", order: 2 },
      { match: "death cure", order: 3 },
      { match: "kill order", order: 4 },
    ],
  },
  {
    series: "Robert Langdon",
    books: [
      { match: "angels and demons", order: 1 },
      { match: "angels & demons", order: 1 },
      { match: "da vinci code", order: 2 },
      { match: "the lost symbol", order: 3 },
      { match: "inferno", order: 4 },
      { match: "origin", order: 5 },
    ],
  },
  {
    series: "Hyperion Cantos",
    books: [
      { match: "hyperion", order: 1 },
      { match: "fall of hyperion", order: 2 },
      { match: "endymion", order: 3 },
      { match: "rise of endymion", order: 4 },
    ],
  },
  {
    series: "Remembrance of Earth's Past",
    books: [
      { match: "three-body problem", order: 1 },
      { match: "three body problem", order: 1 },
      { match: "the dark forest", order: 2 },
      { match: "death's end", order: 3 },
    ],
  },
  {
    series: "MaddAddam",
    books: [
      { match: "oryx and crake", order: 1 },
      { match: "year of the flood", order: 2 },
      { match: "maddaddam", order: 3 },
    ],
  },
  {
    series: "The Folk of the Air",
    books: [
      { match: "the cruel prince", order: 1 },
      { match: "the wicked king", order: 2 },
      { match: "queen of nothing", order: 3 },
    ],
  },
  {
    series: "Shades of Magic",
    books: [
      { match: "a darker shade of magic", order: 1 },
      { match: "a gathering of shadows", order: 2 },
      { match: "a conjuring of light", order: 3 },
    ],
  },
  {
    series: "An Ember in the Ashes",
    books: [
      { match: "ember in the ashes", order: 1 },
      { match: "torch against the night", order: 2 },
      { match: "reaper at the gates", order: 3 },
      { match: "sky beyond the storm", order: 4 },
    ],
  },
  {
    series: "The Magicians",
    books: [
      { match: "the magicians", order: 1 },
      { match: "the magician king", order: 2 },
      { match: "the magician's land", order: 3 },
    ],
  },
  {
    series: "Legacy of Orïsha",
    books: [
      { match: "children of blood and bone", order: 1 },
      { match: "children of virtue and vengeance", order: 2 },
    ],
  },
  {
    series: "The Thursday Murder Club",
    books: [
      { match: "thursday murder club", order: 1 },
      { match: "man who died twice", order: 2 },
      { match: "bullet that missed", order: 3 },
      { match: "last devil to die", order: 4 },
    ],
  },
  {
    series: "Old Man's War",
    books: [
      { match: "old man's war", order: 1 },
      { match: "ghost brigades", order: 2 },
      { match: "last colony", order: 3 },
    ],
  },
  {
    series: "Earthsea",
    books: [
      { match: "wizard of earthsea", order: 1 },
      { match: "tombs of atuan", order: 2 },
      { match: "farthest shore", order: 3 },
      { match: "tehanu", order: 4 },
    ],
  },
  {
    series: "Silo",
    books: [
      { match: "wool", order: 1 },
      { match: "shift", order: 2 },
      { match: "dust", order: 3 },
    ],
  },
  {
    series: "The Dark Tower",
    books: [
      { match: "the gunslinger", order: 1 },
      { match: "drawing of the three", order: 2 },
      { match: "waste lands", order: 3 },
    ],
  },
  {
    series: "Foundation",
    books: [
      { match: "foundation and empire", order: 2 },
      { match: "second foundation", order: 3 },
      { match: "foundation's edge", order: 4 },
      { match: "foundation", order: 1 },  // put last so "foundation" doesn't match "foundation and empire"
    ],
  },
  {
    series: "Grishaverse",
    books: [
      { match: "shadow and bone", order: 1 },
      { match: "siege and storm", order: 2 },
      { match: "ruin and rising", order: 3 },
      { match: "six of crows", order: 4 },
      { match: "crooked kingdom", order: 5 },
      { match: "king of scars", order: 6 },
      { match: "rule of wolves", order: 7 },
    ],
  },
];

// ── Tagging ────────────────────────────────────────────────────────────────────

const allBooks = db.prepare("SELECT id, title FROM books").all() as { id: number; title: string }[];
const updateStmt = db.prepare("UPDATE books SET series = ?, series_order = ? WHERE id = ?");

let tagged = 0;
const alreadyTagged = new Set<number>();

for (const def of SERIES_DEFS) {
  for (const { match, order } of def.books) {
    for (const book of allBooks) {
      if (alreadyTagged.has(book.id)) continue;
      if (book.title.toLowerCase().includes(match.toLowerCase())) {
        updateStmt.run(def.series, order, book.id);
        alreadyTagged.add(book.id);
        console.log(`  [${def.series} #${order}] ${book.title}`);
        tagged++;
      }
    }
  }
}

console.log(`\nTagged ${tagged} books across ${new Set(SERIES_DEFS.map((d) => d.series)).size} series.`);

// Show summary
const seriesList = db
  .prepare("SELECT series, COUNT(*) as n FROM books WHERE series != '' GROUP BY series ORDER BY n DESC")
  .all() as { series: string; n: number }[];

console.log("\nSeries in database:");
for (const row of seriesList) {
  console.log(`  ${row.n} books — ${row.series}`);
}
