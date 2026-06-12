/**
 * Updates book cover URLs using Open Library's work-level covers.
 *
 * Improvement over the original fetch: instead of using the cover_i from
 * whichever search result appeared first (which can be a graphic novel,
 * adaptation, etc.), this script:
 *   1. Searches with strict title + author matching
 *   2. Filters out adaptations / graphic novels / study guides
 *   3. Fetches the canonical work JSON and uses its cover array
 *   4. Validates the cover image actually exists before updating
 *
 * Run with: npx tsx src/update-covers.ts
 */

import db from "./db.js";

// Words in titles that indicate this is NOT the book we want
const EXCLUDE_TITLE_WORDS = [
  "graphic novel", "illustrated", "adaptation", "study guide", "notes on",
  "guide to", "companion to", "cliff", "sparknotes", "barron", "summary",
  "manga", "coloring", "activity book", "workbook", "boxed set", "box set",
  "trilogy box", "omnibus", "collection", "complete works", "selected works",
];

function isBadEdition(title: string): boolean {
  const lower = title.toLowerCase();
  return EXCLUDE_TITLE_WORDS.some((w) => lower.includes(w));
}

// Levenshtein-based similarity: returns 0–1 (1 = identical)
function titleSimilarity(a: string, b: string): number {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const ca = clean(a);
  const cb = clean(b);
  if (ca === cb) return 1;
  if (ca.includes(cb) || cb.includes(ca)) return 0.9;
  const aWords = ca.split(" ");
  const bWords = cb.split(" ");
  const shared = aWords.filter((w) => w.length > 2 && bWords.includes(w)).length;
  return shared / Math.max(aWords.length, bWords.length);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ShelfApp/1.0 (cover-update; contact@shelf.app)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function coverExists(coverId: number): Promise<boolean> {
  if (coverId <= 0) return false;
  try {
    const res = await fetch(
      `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
      { method: "HEAD", headers: { "User-Agent": "ShelfApp/1.0" } }
    );
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image");
  } catch {
    return false;
  }
}

interface CoverResult {
  coverUrl: string;
  source: "work" | "edition" | "unchanged";
}

async function getBestCover(title: string, author: string): Promise<CoverResult | null> {
  const authorLastName = author.split(" ").pop()!;
  const url =
    `https://openlibrary.org/search.json?` +
    `title=${encodeURIComponent(title)}&` +
    `author=${encodeURIComponent(authorLastName)}&` +
    `language=eng&limit=10&` +
    `fields=key,title,author_name,cover_i`;

  const data = await fetchJson(url);
  const docs: any[] = data.docs ?? [];

  // Filter and score results
  const candidates = docs
    .filter((d) => !isBadEdition(d.title ?? ""))
    .filter((d) => d.author_name?.some((a: string) =>
      a.toLowerCase().includes(authorLastName.toLowerCase())
    ))
    .map((d) => ({
      ...d,
      score: titleSimilarity(title, d.title ?? ""),
    }))
    .filter((d) => d.score >= 0.5)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;

  const best = candidates[0];

  // Try work-level cover first (more canonical than edition cover)
  try {
    await sleep(150);
    const work = await fetchJson(`https://openlibrary.org${best.key}.json`);
    const covers: number[] = work.covers ?? [];
    for (const covId of covers) {
      if (covId > 0 && await coverExists(covId)) {
        return { coverUrl: `https://covers.openlibrary.org/b/id/${covId}-L.jpg`, source: "work" };
      }
    }
  } catch {
    // Fall through to edition cover
  }

  // Fall back to the cover_i from the search result
  if (best.cover_i > 0 && await coverExists(best.cover_i)) {
    return { coverUrl: `https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`, source: "edition" };
  }

  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const books = db
  .prepare("SELECT id, title, author, cover_url FROM books ORDER BY title")
  .all() as { id: number; title: string; author: string; cover_url: string }[];

const updateCover = db.prepare("UPDATE books SET cover_url = ? WHERE id = ?");

console.log(`\nUpdating covers for ${books.length} books...\n`);

let updated = 0;
let unchanged = 0;
let failed = 0;

for (let i = 0; i < books.length; i++) {
  const book = books[i];
  const prefix = `[${String(i + 1).padStart(3)}/${books.length}]`;
  process.stdout.write(`${prefix} ${book.title.slice(0, 50)}... `);

  try {
    const result = await getBestCover(book.title, book.author);

    if (result && result.coverUrl !== book.cover_url) {
      updateCover.run(result.coverUrl, book.id);
      console.log(`✓ updated (${result.source})`);
      updated++;
    } else if (result) {
      console.log(`– same`);
      unchanged++;
    } else {
      console.log(`✗ no cover found`);
      failed++;
    }
  } catch (err: any) {
    console.log(`ERROR: ${err.message}`);
    failed++;
  }

  await sleep(600);
}

console.log(`\n${"─".repeat(40)}`);
console.log(`✓ Updated:   ${updated}`);
console.log(`– Unchanged: ${unchanged}`);
console.log(`✗ Failed:    ${failed}`);
