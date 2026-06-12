import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";

interface UserRow {
  id: number;
  username: string;
  created_at: string;
}

interface CountRow {
  count: number;
}

interface FollowRow {
  id: number;
}

function getUserIdFromReq(req: AuthRequest): number | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return undefined;
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload.userId;
  } catch {
    return undefined;
  }
}

const router = Router();

router.get("/:id", (req: AuthRequest, res: Response) => {
  const user = db.prepare(
    "SELECT id, username, created_at FROM users WHERE id = ?"
  ).get(req.params.id) as UserRow | undefined;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const followers = db.prepare(
    "SELECT COUNT(*) as count FROM follows WHERE following_id = ?"
  ).get(user.id) as CountRow;

  const following = db.prepare(
    "SELECT COUNT(*) as count FROM follows WHERE follower_id = ?"
  ).get(user.id) as CountRow;

  const readCount = db.prepare(
    "SELECT COUNT(*) as count FROM read_books WHERE user_id = ?"
  ).get(user.id) as CountRow;

  const reviewCount = db.prepare(
    "SELECT COUNT(*) as count FROM reviews WHERE user_id = ?"
  ).get(user.id) as CountRow;

  let isFollowing = false;
  const currentUserId = getUserIdFromReq(req);
  if (currentUserId && currentUserId !== user.id) {
    const follow = db.prepare(
      "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
    ).get(currentUserId, user.id) as FollowRow | undefined;
    isFollowing = !!follow;
  }

  res.json({
    ...user,
    followers_count: followers.count,
    following_count: following.count,
    read_count: readCount.count,
    review_count: reviewCount.count,
    is_following: isFollowing,
  });
});

router.post("/:id/follow", authMiddleware, (req: AuthRequest, res: Response) => {
  const followingId = Number(req.params.id);
  if (followingId === req.userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(followingId);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)").run(req.userId, followingId);
    res.status(201).json({ message: "Followed" });
  } catch {
    res.status(409).json({ error: "Already following" });
  }
});

router.delete("/:id/follow", authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(req.userId, req.params.id);
  res.json({ message: "Unfollowed" });
});

// --- Favorite books ---

router.get("/:id/favorites", (req: AuthRequest, res: Response) => {
  const favorites = db.prepare(`
    SELECT fb.position, b.*,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
    FROM favorite_books fb
    JOIN books b ON b.id = fb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE fb.user_id = ?
    GROUP BY b.id
    ORDER BY fb.position ASC
  `).all(req.params.id);
  res.json(favorites);
});

router.put("/favorites", authMiddleware, (req: AuthRequest, res: Response) => {
  const { favorites } = req.body as { favorites: { position: number; book_id: number }[] };
  if (!Array.isArray(favorites) || favorites.some((f) => f.position < 1 || f.position > 4)) {
    res.status(400).json({ error: "favorites must be an array with positions 1–4" });
    return;
  }

  const replace = db.transaction(() => {
    db.prepare("DELETE FROM favorite_books WHERE user_id = ?").run(req.userId);
    for (const { position, book_id } of favorites) {
      const exists = db.prepare("SELECT id FROM books WHERE id = ?").get(book_id);
      if (exists) {
        db.prepare(
          "INSERT OR REPLACE INTO favorite_books (user_id, book_id, position) VALUES (?, ?, ?)"
        ).run(req.userId, book_id, position);
      }
    }
  });
  replace();
  res.json({ message: "Favorites updated" });
});

// --- User's lists ---

router.get("/:id/lists", (req: AuthRequest, res: Response) => {
  let viewerId: number | undefined;
  if (req.headers.authorization) {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
      const token = (req.headers.authorization as string).slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      viewerId = payload.userId;
    } catch {}
  }

  const isOwn = viewerId && viewerId === Number(req.params.id);
  const lists = db.prepare(`
    SELECT l.*, u.username,
      (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count,
      (SELECT b.cover_url FROM list_items li JOIN books b ON b.id = li.book_id WHERE li.list_id = l.id ORDER BY li.position LIMIT 1) as cover_url,
      (SELECT COUNT(*) FROM list_likes WHERE list_id = l.id) as like_count
    FROM lists l
    JOIN users u ON u.id = l.user_id
    WHERE l.user_id = ? ${isOwn ? "" : "AND l.is_private = 0"}
    ORDER BY l.updated_at DESC
  `).all(req.params.id);
  res.json(lists);
});

export default router;
