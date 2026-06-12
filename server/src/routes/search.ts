import { Router, Request, Response } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const q = (req.query.q as string || "").trim();
  const type = req.query.type as string | undefined;

  if (!q) {
    res.json({ books: [], authors: [], lists: [] });
    return;
  }

  const like = `%${q}%`;
  const results: Record<string, unknown[]> = {};

  if (!type || type === "books") {
    results.books = db.prepare(`
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      WHERE b.title LIKE ?
      GROUP BY b.id
      ORDER BY read_count DESC
      LIMIT 20
    `).all(like);
  }

  if (!type || type === "authors") {
    results.authors = db.prepare(`
      SELECT b.author,
        COUNT(*) as book_count,
        AVG(r.rating) as avg_rating
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      WHERE b.author LIKE ?
      GROUP BY b.author
      ORDER BY book_count DESC
      LIMIT 20
    `).all(like);
  }

  if (!type || type === "lists") {
    const lists = db.prepare(`
      SELECT l.id, l.title, l.description, l.user_id, u.username,
        (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count,
        (SELECT COUNT(*) FROM list_likes WHERE list_id = l.id) as like_count
      FROM lists l
      JOIN users u ON u.id = l.user_id
      WHERE l.is_private = 0 AND l.title LIKE ?
      ORDER BY like_count DESC
      LIMIT 20
    `).all(like);
    results.lists = lists;
  }

  res.json(results);
});

export default router;
