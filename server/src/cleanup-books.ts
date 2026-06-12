/**
 * Fixes all data-quality issues in the books database:
 *  - Removes adaptations, study-guides, and box-sets
 *  - Removes duplicate entries
 *  - Deletes books with wrong authors / foreign-language titles
 *  - Re-fetches the correct English-language versions from Open Library
 *
 * Run with: npx tsx src/cleanup-books.ts
 */

import db from "./db.js";

// ── Helpers (same pattern as fetch-more-books.ts) ─────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ShelfApp/1.0 (book-cleanup; contact@shelf.app)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function extractDescription(raw: unknown): string {
  if (!raw) return "";
  const text = typeof raw === "string" ? raw : (raw as any).value ?? "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

async function fetchWorkDescription(workKey: string): Promise<string> {
  try {
    await sleep(150);
    const work = await fetchJson(`https://openlibrary.org${workKey}.json`);
    return extractDescription(work.description);
  } catch {
    return "";
  }
}

async function searchAndFetch(title: string, author: string) {
  const url =
    `https://openlibrary.org/search.json?` +
    `title=${encodeURIComponent(title)}&` +
    `author=${encodeURIComponent(author)}&` +
    `limit=5&` +
    `fields=key,title,author_name,cover_i,subject_facet`;

  const data = await fetchJson(url);
  const docs: any[] = data.docs ?? [];

  const authorLast = author.split(" ").pop()!.toLowerCase();
  const match =
    docs.find((d) => d.cover_i && d.author_name?.some((a: string) => a.toLowerCase().includes(authorLast))) ??
    docs.find((d) => d.cover_i) ??
    null;

  if (!match || !match.cover_i) return null;

  const description = await fetchWorkDescription(match.key);
  return {
    title: match.title as string,
    author: (match.author_name as string[])[0],
    cover_url: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`,
    description,
    genre: (match.subject_facet as string[] | undefined)?.[0] ?? "",
  };
}

// ── Prepared statements ───────────────────────────────────────────────────────

const deleteById = db.prepare("DELETE FROM books WHERE id = ?");
const insertBook = db.prepare(
  "INSERT INTO books (title, author, cover_url, description, genre) VALUES (?, ?, ?, ?, ?)"
);
const existsByTitle = db.prepare("SELECT id FROM books WHERE lower(title) = lower(?)");

// ── Step 1: Delete-only entries (no replacement needed) ───────────────────────

console.log("\n── Step 1: Removing non-book entries ──");

const deleteOnlyIds: number[] = db
  .prepare(
    `SELECT id FROM books WHERE
       title LIKE 'MADDADDAM TRILOGY BOX%'
    OR title LIKE '%adapted for Young Adults%'
    OR title LIKE '%Man%s Search for Meaning adapted%'
    OR title LIKE '%key to%name of the rose%'`
  )
  .all()
  .map((r: any) => r.id);

for (const id of deleteOnlyIds) {
  const b = db.prepare("SELECT title FROM books WHERE id = ?").get(id) as any;
  deleteById.run(id);
  console.log(`  Deleted: "${b.title}"`);
}

// ── Step 2: Remove exact duplicates (keep lowest id) ─────────────────────────

console.log("\n── Step 2: Removing duplicates ──");

const dupeGroups = db
  .prepare(
    `SELECT lower(title) as ltitle, COUNT(*) as n, MIN(id) as keep_id
     FROM books GROUP BY lower(title) HAVING n > 1`
  )
  .all() as { ltitle: string; n: number; keep_id: number }[];

for (const { ltitle, keep_id } of dupeGroups) {
  const dupes = db
    .prepare("SELECT id, title FROM books WHERE lower(title) = ? AND id != ?")
    .all(ltitle, keep_id) as { id: number; title: string }[];
  for (const dupe of dupes) {
    deleteById.run(dupe.id);
    console.log(`  Deleted duplicate: "${dupe.title}" (id ${dupe.id}, kept id ${keep_id})`);
  }
}

// ── Step 3: Delete wrong entries and queue re-fetches ─────────────────────────

console.log("\n── Step 3: Replacing wrong entries ──");

interface Replacement {
  deleteIds: number[];
  fetch: { title: string; author: string };
}

function findIds(...titlePatterns: string[]): number[] {
  return titlePatterns.flatMap((p) =>
    (db.prepare("SELECT id FROM books WHERE lower(title) LIKE lower(?)").all(p) as any[]).map((r) => r.id)
  );
}

const REPLACEMENTS: Replacement[] = [
  {
    deleteIds: findIds("The Alchemist, 1612%", "The Alchemist%1612%"),
    fetch: { title: "The Alchemist", author: "Paulo Coelho" },
  },
  {
    deleteIds: findIds("The Hitchhiker%Guide%"),
    fetch: { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams" },
  },
  {
    deleteIds: findIds("I, Robot%"),
    fetch: { title: "I, Robot", author: "Isaac Asimov" },
  },
  {
    deleteIds: findIds("Don Quixote%"),
    fetch: { title: "Don Quixote", author: "Miguel de Cervantes" },
  },
  {
    deleteIds: findIds("%hundred years of solitude%"),
    fetch: { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez" },
  },
  {
    deleteIds: findIds("Crime and Punishment%"),
    fetch: { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  },
  {
    deleteIds: findIds("1984 (adaptation)%"),
    fetch: { title: "1984", author: "George Orwell" },
  },
  {
    deleteIds: findIds("%three musketeers%"),
    fetch: { title: "The Three Musketeers", author: "Alexandre Dumas" },
  },
  {
    deleteIds: findIds("%Count of Monte Cristo%"),
    fetch: { title: "The Count of Monte Cristo", author: "Alexandre Dumas" },
  },
  {
    deleteIds: findIds("%shadow of the wind%", "In the shadow%"),
    fetch: { title: "The Shadow of the Wind", author: "Carlos Ruiz Zafon" },
  },
  {
    // Dark Forest was fetched with Chinese author + wrong book for Three-Body entry
    deleteIds: findIds("%Dark Forest%"),
    fetch: { title: "The Dark Forest", author: "Liu Cixin" },
  },
  {
    // Re-add The Three-Body Problem (was mis-matched to Dark Forest earlier)
    deleteIds: [],
    fetch: { title: "The Three-Body Problem", author: "Liu Cixin" },
  },
  {
    deleteIds: findIds("La mujer en la ventana%"),
    fetch: { title: "The Woman in the Window", author: "A.J. Finn" },
  },
  {
    deleteIds: findIds("%Iliad%"),
    fetch: { title: "The Iliad", author: "Homer" },
  },
  {
    deleteIds: findIds("The Odyssey%"),
    fetch: { title: "The Odyssey", author: "Homer" },
  },
  {
    deleteIds: findIds("War and Peace%"),
    fetch: { title: "War and Peace", author: "Leo Tolstoy" },
  },
  {
    deleteIds: findIds("%Karamazov%"),
    fetch: { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky" },
  },
  {
    deleteIds: findIds("%three musketeers%", "%musketeers%"),
    fetch: { title: "The Three Musketeers", author: "Alexandre Dumas" },
  },
];

// Collect all IDs to delete (deduplicated)
const allDeleteIds = new Set(REPLACEMENTS.flatMap((r) => r.deleteIds));

// Delete them
for (const id of allDeleteIds) {
  const b = db.prepare("SELECT title, author FROM books WHERE id = ?").get(id) as any;
  if (b) {
    deleteById.run(id);
    console.log(`  Deleted: "${b.title}" by ${b.author}`);
  }
}

// Re-fetch replacements
console.log("\n── Step 4: Fetching correct replacements ──");

// Track which titles we've already re-added in this run
const addedTitles = new Set<string>();

for (const replacement of REPLACEMENTS) {
  const { title, author } = replacement.fetch;

  // Skip if we already added this title in this run
  const key = title.toLowerCase();
  if (addedTitles.has(key)) continue;

  // Skip if already in DB (from a previous run)
  const existing = existsByTitle.get(title);
  if (existing) {
    console.log(`  Already in DB: "${title}"`);
    addedTitles.add(key);
    continue;
  }

  process.stdout.write(`  Fetching: "${title}" by ${author}... `);
  try {
    await sleep(600);
    const result = await searchAndFetch(title, author);
    if (result) {
      insertBook.run(result.title, result.author, result.cover_url, result.description, result.genre);
      console.log(`✓ added as "${result.title}" by ${result.author}`);
      addedTitles.add(key);
    } else {
      console.log("✗ not found on Open Library");
    }
  } catch (err: any) {
    console.log(`ERROR: ${err.message}`);
  }
}

// ── Step 5: Re-run series tagging for any newly added books ──────────────────

console.log("\n── Step 5: Re-applying series tags to new entries ──");

const QUICK_SERIES: { series: string; order: number; match: string }[] = [
  { series: "Remembrance of Earth's Past", order: 1, match: "three-body problem" },
  { series: "Remembrance of Earth's Past", order: 2, match: "the dark forest" },
  { series: "Robert Langdon", order: 2, match: "da vinci code" },
  { series: "Robert Langdon", order: 1, match: "angels and demons" },
  { series: "The Lord of the Rings", order: 1, match: "fellowship of the ring" },
  { series: "The Lord of the Rings", order: 2, match: "two towers" },
  { series: "The Lord of the Rings", order: 3, match: "return of the king" },
  { series: "The Hunger Games", order: 1, match: "the hunger games" },
  { series: "The Hunger Games", order: 2, match: "catching fire" },
  { series: "The Hunger Games", order: 3, match: "mockingjay" },
  { series: "Mistborn", order: 1, match: "the final empire" },
  { series: "Mistborn", order: 1, match: "mistborn" },
  { series: "Mistborn", order: 2, match: "well of ascension" },
  { series: "Mistborn", order: 3, match: "hero of ages" },
];

const updateSeries = db.prepare("UPDATE books SET series = ?, series_order = ? WHERE lower(title) LIKE lower(?) AND (series = '' OR series IS NULL)");
for (const { series, order, match } of QUICK_SERIES) {
  const changes = updateSeries.run(series, order, `%${match}%`);
  if ((changes as any).changes > 0) {
    console.log(`  Tagged: "${match}" → ${series} #${order}`);
  }
}

// ── Final summary ─────────────────────────────────────────────────────────────

const total = (db.prepare("SELECT COUNT(*) as n FROM books").get() as any).n;
console.log(`\n── Done. Total books in DB: ${total} ──`);
