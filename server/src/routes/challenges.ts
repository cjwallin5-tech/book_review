import { Router, Response } from "express";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

function getChallengeProgress(userId: number, type: string, year: number): number {
  if (type === "genre_explorer") {
    const row = db.prepare(`
      SELECT COUNT(DISTINCT b.genre) as count
      FROM read_books rb
      JOIN books b ON b.id = rb.book_id
      WHERE rb.user_id = ? AND b.genre != '' AND strftime('%Y', rb.created_at) = ?
    `).get(userId, String(year)) as { count: number };
    return row.count;
  }
  if (type === "author_variety") {
    const row = db.prepare(`
      SELECT COUNT(DISTINCT b.author) as count
      FROM read_books rb
      JOIN books b ON b.id = rb.book_id
      WHERE rb.user_id = ? AND strftime('%Y', rb.created_at) = ?
    `).get(userId, String(year)) as { count: number };
    return row.count;
  }
  if (type === "series_complete") {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT b.series
        FROM books b
        WHERE b.series IS NOT NULL AND b.series != ''
        GROUP BY b.series
        HAVING COUNT(*) >= 2
          AND COUNT(*) = (
            SELECT COUNT(*) FROM read_books rb2
            JOIN books b2 ON b2.id = rb2.book_id
            WHERE rb2.user_id = ? AND b2.series = b.series
          )
      )
    `).get(userId) as { count: number };
    return row.count;
  }
  return 0;
}

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const year = new Date().getFullYear();
  const challenges = db.prepare(
    "SELECT * FROM user_challenges WHERE user_id = ? AND year = ? ORDER BY created_at ASC"
  ).all(req.userId, year) as any[];

  const result = challenges.map((c) => ({
    ...c,
    progress: getChallengeProgress(req.userId!, c.type, year),
  }));
  res.json(result);
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { type, target } = req.body;
  const validTypes = ["genre_explorer", "author_variety", "series_complete"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid challenge type" });
    return;
  }
  if (!target || typeof target !== "number" || target < 1) {
    res.status(400).json({ error: "target must be a positive number" });
    return;
  }
  const year = new Date().getFullYear();
  try {
    const result = db.prepare(
      "INSERT INTO user_challenges (user_id, type, target, year) VALUES (?, ?, ?, ?)"
    ).run(req.userId, type, target, year);
    const challenge = db.prepare("SELECT * FROM user_challenges WHERE id = ?").get(result.lastInsertRowid) as any;
    res.status(201).json({ ...challenge, progress: getChallengeProgress(req.userId!, type, year) });
  } catch {
    res.status(409).json({ error: "Challenge of this type already exists for this year" });
  }
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const result = db.prepare(
    "DELETE FROM user_challenges WHERE id = ? AND user_id = ?"
  ).run(req.params.id, req.userId);
  if (result.changes === 0) { res.status(404).json({ error: "Challenge not found" }); return; }
  res.json({ message: "Deleted" });
});

export default router;
