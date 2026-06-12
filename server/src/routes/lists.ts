import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// --- Public ---

router.get("/", (req: Request, res: Response) => {
  const lists = db.prepare(`
    SELECT l.*, u.username,
      (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count,
      (SELECT b.cover_url FROM list_items li JOIN books b ON b.id = li.book_id WHERE li.list_id = l.id ORDER BY li.position LIMIT 1) as cover_url,
      (SELECT COUNT(*) FROM list_likes WHERE list_id = l.id) as like_count
    FROM lists l
    JOIN users u ON u.id = l.user_id
    WHERE l.is_private = 0
    ORDER BY l.updated_at DESC
  `).all();
  res.json(lists);
});

router.get("/:id", (req: AuthRequest, res: Response) => {
  const list = db.prepare(`
    SELECT l.*, u.username
    FROM lists l
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;

  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }

  let userId: number | undefined;
  if (req.headers.authorization) {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
      const token = (req.headers.authorization as string).slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = payload.userId;
    } catch {}
  }

  if (list.is_private && list.user_id !== userId) {
    res.status(404).json({ error: "List not found" });
    return;
  }

  const items = db.prepare(`
    SELECT li.*, b.title, b.author, b.cover_url
    FROM list_items li
    JOIN books b ON b.id = li.book_id
    WHERE li.list_id = ?
    ORDER BY li.position
  `).all(req.params.id);

  const likeCount = db.prepare(
    "SELECT COUNT(*) as count FROM list_likes WHERE list_id = ?"
  ).get(req.params.id) as { count: number };

  let isLiked = false;
  if (userId) {
    const like = db.prepare(
      "SELECT id FROM list_likes WHERE list_id = ? AND user_id = ?"
    ).get(req.params.id, userId);
    isLiked = !!like;
  }

  res.json({ ...list, items, like_count: likeCount.count, is_liked: isLiked });
});

// --- Authenticated ---

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, description, is_private } = req.body;
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const result = db.prepare(
    "INSERT INTO lists (user_id, title, description, is_private) VALUES (?, ?, ?, ?)"
  ).run(req.userId, title, description || "", is_private ? 1 : 0);

  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(list);
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, description, is_private } = req.body;
  const list = db.prepare("SELECT * FROM lists WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as Record<string, unknown> | undefined;

  if (!list) {
    res.status(404).json({ error: "List not found or not yours" });
    return;
  }

  db.prepare(
    "UPDATE lists SET title = COALESCE(?, title), description = COALESCE(?, description), is_private = COALESCE(?, is_private), updated_at = datetime('now') WHERE id = ?"
  ).run(title || null, description !== undefined ? description : null, is_private !== undefined ? (is_private ? 1 : 0) : null, req.params.id);

  const updated = db.prepare("SELECT * FROM lists WHERE id = ?").get(req.params.id);
  res.json(updated);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const result = db.prepare("DELETE FROM lists WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: "List not found or not yours" });
    return;
  }
  res.json({ message: "List deleted" });
});

// --- List items ---

router.post("/:id/items", authMiddleware, (req: AuthRequest, res: Response) => {
  const { book_id } = req.body;
  if (!book_id) {
    res.status(400).json({ error: "book_id is required" });
    return;
  }

  const list = db.prepare("SELECT id FROM lists WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!list) {
    res.status(404).json({ error: "List not found or not yours" });
    return;
  }

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(book_id);
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) as m FROM list_items WHERE list_id = ?").get(req.params.id) as { m: number };

  try {
    db.prepare("INSERT INTO list_items (list_id, book_id, position) VALUES (?, ?, ?)").run(req.params.id, book_id, maxPos.m + 1);
    res.status(201).json({ message: "Book added to list" });
  } catch {
    res.status(409).json({ error: "Book already in list" });
  }
});

router.delete("/:id/items/:bookId", authMiddleware, (req: AuthRequest, res: Response) => {
  const list = db.prepare("SELECT id FROM lists WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!list) {
    res.status(404).json({ error: "List not found or not yours" });
    return;
  }

  db.prepare("DELETE FROM list_items WHERE list_id = ? AND book_id = ?").run(req.params.id, req.params.bookId);
  res.json({ message: "Book removed from list" });
});

// --- Likes ---

router.post("/:id/like", authMiddleware, (req: AuthRequest, res: Response) => {
  const list = db.prepare("SELECT id FROM lists WHERE id = ?").get(req.params.id);
  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }

  try {
    db.prepare("INSERT INTO list_likes (list_id, user_id) VALUES (?, ?)").run(req.params.id, req.userId);
    res.status(201).json({ message: "Liked" });
  } catch {
    res.status(409).json({ error: "Already liked" });
  }
});

router.delete("/:id/like", authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM list_likes WHERE list_id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.json({ message: "Unliked" });
});

// --- List comments ---

router.get("/:id/comments", (req: Request, res: Response) => {
  const comments = db.prepare(`
    SELECT lc.*, u.username
    FROM list_comments lc
    JOIN users u ON u.id = lc.user_id
    WHERE lc.list_id = ?
    ORDER BY lc.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

router.post("/:id/comments", authMiddleware, (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const list = db.prepare("SELECT id FROM lists WHERE id = ?").get(req.params.id);
  if (!list) {
    res.status(404).json({ error: "List not found" });
    return;
  }

  const result = db.prepare(
    "INSERT INTO list_comments (list_id, user_id, content) VALUES (?, ?, ?)"
  ).run(req.params.id, req.userId, content.trim());

  const comment = db.prepare(`
    SELECT lc.*, u.username
    FROM list_comments lc
    JOIN users u ON u.id = lc.user_id
    WHERE lc.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

router.delete("/:id/comments/:commentId", authMiddleware, (req: AuthRequest, res: Response) => {
  const result = db.prepare("DELETE FROM list_comments WHERE id = ? AND user_id = ?").run(req.params.commentId, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: "Comment not found or not yours" });
    return;
  }
  res.json({ message: "Comment deleted" });
});

export default router;
