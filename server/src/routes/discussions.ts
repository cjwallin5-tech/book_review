import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// --- Categories ---

router.get("/categories", (_req: Request, res: Response) => {
  const categories = db.prepare(`
    SELECT dc.*,
      (SELECT COUNT(*) FROM discussion_threads dt WHERE dt.category_id = dc.id) as thread_count
    FROM discussion_categories dc
    ORDER BY dc.position
  `).all();
  res.json(categories);
});

// --- Threads ---

router.get("/categories/:id/threads", (req: Request, res: Response) => {
  const category = db.prepare("SELECT id, name FROM discussion_categories WHERE id = ?").get(req.params.id);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const threads = db.prepare(`
    SELECT dt.*, u.username
    FROM discussion_threads dt
    JOIN users u ON u.id = dt.user_id
    WHERE dt.category_id = ?
    ORDER BY dt.updated_at DESC
  `).all(req.params.id);

  res.json({ category, threads });
});

router.post("/categories/:id/threads", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, body } = req.body;
  if (!title || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const category = db.prepare("SELECT id FROM discussion_categories WHERE id = ?").get(req.params.id);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const now = new Date().toISOString();
  const result = db.prepare(
    "INSERT INTO discussion_threads (category_id, user_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.params.id, req.userId, title.trim(), body?.trim() || "", now, now);

  const thread = db.prepare(`
    SELECT dt.*, u.username
    FROM discussion_threads dt
    JOIN users u ON u.id = dt.user_id
    WHERE dt.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(thread);
});

router.get("/threads/:id", (req: Request, res: Response) => {
  const thread = db.prepare(`
    SELECT dt.*, u.username, dc.name as category_name
    FROM discussion_threads dt
    JOIN users u ON u.id = dt.user_id
    JOIN discussion_categories dc ON dc.id = dt.category_id
    WHERE dt.id = ?
  `).get(req.params.id) as Record<string, unknown> | undefined;

  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const posts = db.prepare(`
    SELECT dp.*, u.username
    FROM discussion_posts dp
    JOIN users u ON u.id = dp.user_id
    WHERE dp.thread_id = ?
    ORDER BY dp.created_at ASC
  `).all(req.params.id);

  res.json({ thread, posts });
});

// --- Posts ---

router.post("/threads/:id/posts", authMiddleware, (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const thread = db.prepare("SELECT id FROM discussion_threads WHERE id = ?").get(req.params.id);
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const result = db.prepare(
    "INSERT INTO discussion_posts (thread_id, user_id, content) VALUES (?, ?, ?)"
  ).run(req.params.id, req.userId, content.trim());

  db.prepare(
    "UPDATE discussion_threads SET post_count = post_count + 1, updated_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), req.params.id);

  const post = db.prepare(`
    SELECT dp.*, u.username
    FROM discussion_posts dp
    JOIN users u ON u.id = dp.user_id
    WHERE dp.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(post);
});

router.delete("/posts/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const post = db.prepare("SELECT id, thread_id FROM discussion_posts WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as Record<string, unknown> | undefined;
  if (!post) {
    res.status(404).json({ error: "Post not found or not yours" });
    return;
  }

  db.prepare("DELETE FROM discussion_posts WHERE id = ?").run(req.params.id);
  db.prepare(
    "UPDATE discussion_threads SET post_count = post_count - 1 WHERE id = ?"
  ).run(post.thread_id);

  res.json({ message: "Post deleted" });
});

export default router;
