/**
 * Fixes the 10 books that update-covers.ts couldn't handle because
 * Open Library stores their author names in non-Latin scripts (Cyrillic, Chinese)
 * which broke the author-name filter. Uses title-only search with strict title matching.
 */

import db from "./db.js";

const TARGETS = [
  { title: "A Man Called Ove",              searchTitle: "man called ove backman" },
  { title: "Crime and Punishment",           searchTitle: "crime and punishment dostoevsky" },
  { title: "One Hundred Years of Solitude",  searchTitle: "one hundred years of solitude marquez" },
  { title: "The Brothers Karamazov",         searchTitle: "brothers karamazov dostoevsky" },
  { title: "The Dark Forest",                searchTitle: "dark forest liu cixin three body" },
  { title: "The Hitchhiker's Guide to the Galaxy", searchTitle: "hitchhiker guide galaxy douglas adams" },
  { title: "The Odyssey",                    searchTitle: "odyssey homer english translation" },
  { title: "The Shadow of the Wind",         searchTitle: "shadow of the wind ruiz zafon" },
  { title: "The Three-Body Problem",         searchTitle: "three body problem liu cixin" },
  { title: "War and Peace",                  searchTitle: "war and peace tolstoy english" },
];

const EXCLUDE = ["graphic novel", "adaptation", "study guide", "notes", "cliff", "sparknotes", "summary", "workbook", "manga", "boxed set", "omnibus", "collection"];

function isBad(title: string) {
  const t = title.toLowerCase();
  return EXCLUDE.some((w) => t.includes(w));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": "ShelfApp/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const updateCover = db.prepare("UPDATE books SET cover_url = ? WHERE lower(title) = lower(?)");

for (const target of TARGETS) {
  process.stdout.write(`${target.title}... `);
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(target.searchTitle)}&language=eng&limit=10&fields=key,title,author_name,cover_i`;
    const data = await fetchJson(url);
    const docs: any[] = (data.docs ?? []).filter((d: any) => !isBad(d.title ?? "") && d.cover_i > 0);

    if (docs.length === 0) { console.log("✗ no results"); await sleep(600); continue; }

    // Try work-level cover from the first good result
    let coverUrl: string | null = null;
    for (const doc of docs.slice(0, 3)) {
      try {
        await sleep(150);
        const work = await fetchJson(`https://openlibrary.org${doc.key}.json`);
        const covers: number[] = (work.covers ?? []).filter((c: number) => c > 0);
        if (covers.length > 0) {
          coverUrl = `https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg`;
          break;
        }
      } catch {}
      // Fall back to edition cover_i
      if (doc.cover_i > 0) {
        coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        break;
      }
    }

    if (coverUrl) {
      updateCover.run(coverUrl, target.title);
      console.log(`✓ ${coverUrl.slice(-20)}`);
    } else {
      console.log("✗ no cover_i found");
    }
  } catch (err: any) {
    console.log(`ERROR: ${err.message}`);
  }
  await sleep(700);
}

console.log("\nDone.");
