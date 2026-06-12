import { Router } from "express";
import db from "../db.js";
const router = Router();
router.get("/", (req, res) => {
    const following = req.query.following;
    let userId;
    if (following === "true" && req.headers.authorization) {
        try {
            const jwt = require("jsonwebtoken");
            const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
            const token = req.headers.authorization.slice(7);
            const payload = jwt.verify(token, JWT_SECRET);
            userId = payload.userId;
        }
        catch { }
    }
    let userFilter = "";
    let params = [];
    if (userId) {
        userFilter = `AND (r.user_id = ? OR r.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))`;
        params = [userId, userId];
    }
    const reviews = db.prepare(`
    SELECT 'review' as type, r.id, r.created_at as date, r.rating, r.content,
      b.id as book_id, b.title, b.author, b.cover_url,
      u.id as user_id, u.username
    FROM reviews r
    JOIN books b ON b.id = r.book_id
    JOIN users u ON u.id = r.user_id
    WHERE 1=1 ${userFilter}
    ORDER BY r.created_at DESC
    LIMIT 30
  `).all(...params);
    let diaryFilter = "";
    let diaryParams = [];
    if (userId) {
        diaryFilter = `AND (rl.user_id = ? OR rl.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))`;
        diaryParams = [userId, userId];
    }
    const diary = db.prepare(`
    SELECT 'diary' as type, rl.id, rl.created_at as date, rl.start_date, rl.end_date, rl.format,
      b.id as book_id, b.title, b.author, b.cover_url,
      u.id as user_id, u.username
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    JOIN users u ON u.id = rl.user_id
    WHERE 1=1 ${diaryFilter}
    ORDER BY rl.created_at DESC
    LIMIT 30
  `).all(...diaryParams);
    let listFilter = "";
    let listParams = [];
    if (userId) {
        listFilter = `AND (l.user_id = ? OR l.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))`;
        listParams = [userId, userId];
    }
    const lists = db.prepare(`
    SELECT 'list' as type, l.id, l.created_at as date, l.title, l.description,
      u.id as user_id, u.username
    FROM lists l
    JOIN users u ON u.id = l.user_id
    WHERE l.is_private = 0 ${listFilter}
    ORDER BY l.created_at DESC
    LIMIT 30
  `).all(...listParams);
    const feed = [...reviews, ...diary, ...lists]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);
    res.json(feed);
});
export default router;
