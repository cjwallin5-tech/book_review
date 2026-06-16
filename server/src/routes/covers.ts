import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COVERS_DIR = path.join(__dirname, "../../covers");

fs.mkdirSync(COVERS_DIR, { recursive: true });

const router = Router();

router.get("/:coverId", async (req: Request, res: Response) => {
  const coverId = req.params.coverId as string;
  if (!/^\d+$/.test(coverId)) { res.sendStatus(400); return; }

  const coverPath = path.join(COVERS_DIR, `${coverId}.jpg`);

  // Serve from disk cache if available
  if (fs.existsSync(coverPath)) {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(coverPath);
    return;
  }

  // Fetch from Open Library, cache to disk, then serve
  try {
    const upstream = await fetch(
      `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!upstream.ok) { res.sendStatus(404); return; }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    fs.writeFileSync(coverPath, buffer);

    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.set("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch {
    res.sendStatus(502);
  }
});

// Pre-warm: download all covers in the background so future loads are instant
export async function prewarmCovers(): Promise<void> {
  const db = (await import("../db.js")).default;
  const books = db
    .prepare("SELECT cover_url FROM books WHERE cover_url LIKE '%covers.openlibrary.org%'")
    .all() as { cover_url: string }[];

  const OL_RE = /covers\.openlibrary\.org\/b\/id\/(\d+)-[SML]\.jpg/;
  const ids = [...new Set(
    books.map(b => b.cover_url.match(OL_RE)?.[1]).filter(Boolean) as string[]
  )];

  let cached = 0;
  for (const id of ids) {
    const coverPath = path.join(COVERS_DIR, `${id}.jpg`);
    if (fs.existsSync(coverPath)) { cached++; continue; }
    try {
      const res = await fetch(
        `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        fs.writeFileSync(coverPath, Buffer.from(await res.arrayBuffer()));
        cached++;
      }
    } catch { /* skip */ }
    await new Promise<void>(r => setTimeout(r, 80));
  }
  console.log(`[covers] Pre-warmed ${cached}/${ids.length} covers.`);
}

export default router;
