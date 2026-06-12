import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
const router = Router();
router.get("/", (req, res) => {
    const { author, sort } = req.query;
    let sql;
    let params;
    if (author && typeof author === "string") {
        sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      WHERE b.author = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
        params = [author];
    }
    else if (sort === "rating") {
        sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      HAVING review_count > 0
      ORDER BY avg_rating DESC, review_count DESC
    `;
        params = [];
    }
    else {
        sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY read_count DESC, b.created_at DESC
    `;
        params = [];
    }
    const books = db.prepare(sql).all(...params);
    res.json(books);
});
router.get("/:id", (req, res) => {
    const book = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM books b
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
  `).get(req.params.id);
    if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
    }
    const rawReviews = db.prepare("SELECT * FROM reviews WHERE book_id = ? ORDER BY created_at DESC").all(req.params.id);
    let userId;
    if (req.headers.authorization) {
        try {
            const jwt = require("jsonwebtoken");
            const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
            const token = req.headers.authorization.slice(7);
            const payload = jwt.verify(token, JWT_SECRET);
            userId = payload.userId;
        }
        catch { }
    }
    const reviews = rawReviews.map((r) => {
        const likeCount = db.prepare("SELECT COUNT(*) as count FROM review_likes WHERE review_id = ?").get(r.id);
        const commentCount = db.prepare("SELECT COUNT(*) as count FROM review_comments WHERE review_id = ?").get(r.id);
        let isLiked = false;
        if (userId) {
            const like = db.prepare("SELECT id FROM review_likes WHERE review_id = ? AND user_id = ?").get(r.id, userId);
            isLiked = !!like;
        }
        return {
            ...r,
            like_count: likeCount.count,
            comment_count: commentCount.count,
            is_liked: isLiked,
        };
    });
    res.json({ ...book, reviews });
});
router.post("/", (req, res) => {
    const { title, author, cover_url, description } = req.body;
    if (!title || !author || !cover_url) {
        res.status(400).json({ error: "title, author, and cover_url are required" });
        return;
    }
    const result = db.prepare("INSERT INTO books (title, author, cover_url, description) VALUES (?, ?, ?, ?)").run(title, author, cover_url, description || "");
    const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(book);
});
router.post("/:id/reviews", authMiddleware, (req, res) => {
    const { rating, content } = req.body;
    if (!rating || !content) {
        res.status(400).json({ error: "rating and content are required" });
        return;
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        res.status(400).json({ error: "rating must be a number between 1 and 5" });
        return;
    }
    const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
    if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
    }
    const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(req.userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    const result = db.prepare("INSERT INTO reviews (book_id, user_id, user_name, rating, content) VALUES (?, ?, ?, ?, ?)").run(req.params.id, user.id, user.username, rating, content);
    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(review);
});
// --- User-specific authenticated routes ---
router.get("/tbr/list", authMiddleware, (req, res) => {
    const books = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM tbr_books tb
    JOIN books b ON b.id = tb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE tb.user_id = ?
    GROUP BY b.id
    ORDER BY tb.created_at DESC
  `).all(req.userId);
    res.json(books);
});
router.post("/:id/tbr", authMiddleware, (req, res) => {
    const bookId = Number(req.params.id);
    const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
    if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
    }
    try {
        db.prepare("INSERT INTO tbr_books (user_id, book_id) VALUES (?, ?)").run(req.userId, bookId);
        res.status(201).json({ message: "Added to TBR" });
    }
    catch {
        res.status(409).json({ error: "Book already in TBR" });
    }
});
router.delete("/:id/tbr", authMiddleware, (req, res) => {
    db.prepare("DELETE FROM tbr_books WHERE user_id = ? AND book_id = ?").run(req.userId, req.params.id);
    res.json({ message: "Removed from TBR" });
});
router.get("/read/list", authMiddleware, (req, res) => {
    const books = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM read_books rb
    JOIN books b ON b.id = rb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE rb.user_id = ?
    GROUP BY b.id
    ORDER BY rb.created_at DESC
  `).all(req.userId);
    res.json(books);
});
router.post("/:id/read", authMiddleware, (req, res) => {
    const bookId = Number(req.params.id);
    const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
    if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
    }
    try {
        db.prepare("INSERT INTO read_books (user_id, book_id) VALUES (?, ?)").run(req.userId, bookId);
        res.status(201).json({ message: "Marked as read" });
    }
    catch {
        db.prepare("DELETE FROM read_books WHERE user_id = ? AND book_id = ?").run(req.userId, bookId);
        res.json({ message: "Unmarked as read" });
    }
});
router.get("/:id/read-status", authMiddleware, (req, res) => {
    const entry = db.prepare("SELECT id FROM read_books WHERE user_id = ? AND book_id = ?").get(req.userId, req.params.id);
    res.json({ read: !!entry });
});
// --- Diary ---
router.get("/diary/list", authMiddleware, (req, res) => {
    const entries = db.prepare(`
    SELECT rl.*, b.title, b.author, b.cover_url
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    WHERE rl.user_id = ?
    ORDER BY COALESCE(rl.end_date, rl.start_date) DESC, rl.created_at DESC
  `).all(req.userId);
    res.json(entries);
});
router.post("/:id/diary", authMiddleware, (req, res) => {
    const { start_date, end_date, format } = req.body;
    const bookId = Number(req.params.id);
    if (!start_date) {
        res.status(400).json({ error: "start_date is required" });
        return;
    }
    const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
    if (!book) {
        res.status(404).json({ error: "Book not found" });
        return;
    }
    const result = db.prepare("INSERT INTO reading_log (user_id, book_id, start_date, end_date, format) VALUES (?, ?, ?, ?, ?)").run(req.userId, bookId, start_date, end_date || null, format || "paperback");
    const entry = db.prepare(`
    SELECT rl.*, b.title, b.author, b.cover_url
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    WHERE rl.id = ?
  `).get(result.lastInsertRowid);
    res.status(201).json(entry);
});
router.delete("/diary/:id", authMiddleware, (req, res) => {
    const result = db.prepare("DELETE FROM reading_log WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    if (result.changes === 0) {
        res.status(404).json({ error: "Entry not found" });
        return;
    }
    res.json({ message: "Entry removed" });
});
// --- Open Library search ---
router.get("/search/open-library", async (req, res) => {
    const q = req.query.q;
    if (!q || !q.trim()) {
        res.status(400).json({ error: "Query parameter q is required" });
        return;
    }
    try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=key,title,author_name,first_sentence,cover_i,subject_facet,language`;
        const response = await fetch(url);
        const data = await response.json();
        const results = data.docs
            .filter((d) => d.title && d.author_name && d.cover_i && d.language?.includes("eng"))
            .map((d) => ({
            title: d.title,
            author: d.author_name[0],
            cover_url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
            description: d.first_sentence?.[0] || "",
            olid: d.key,
        }));
        res.json(results);
    }
    catch {
        res.status(500).json({ error: "Failed to search Open Library" });
    }
});
// --- Review likes ---
router.post("/:bookId/reviews/:reviewId/like", authMiddleware, (req, res) => {
    try {
        db.prepare("INSERT INTO review_likes (review_id, user_id) VALUES (?, ?)").run(req.params.reviewId, req.userId);
        res.status(201).json({ message: "Liked" });
    }
    catch {
        res.status(409).json({ error: "Already liked" });
    }
});
router.delete("/:bookId/reviews/:reviewId/like", authMiddleware, (req, res) => {
    db.prepare("DELETE FROM review_likes WHERE review_id = ? AND user_id = ?").run(req.params.reviewId, req.userId);
    res.json({ message: "Unliked" });
});
// --- Review comments ---
router.get("/:bookId/reviews/:reviewId/comments", (req, res) => {
    const comments = db.prepare(`
    SELECT rc.*, u.username
    FROM review_comments rc
    JOIN users u ON u.id = rc.user_id
    WHERE rc.review_id = ?
    ORDER BY rc.created_at ASC
  `).all(req.params.reviewId);
    res.json(comments);
});
router.post("/:bookId/reviews/:reviewId/comments", authMiddleware, (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        res.status(400).json({ error: "content is required" });
        return;
    }
    const result = db.prepare("INSERT INTO review_comments (review_id, user_id, content) VALUES (?, ?, ?)").run(req.params.reviewId, req.userId, content.trim());
    const comment = db.prepare(`
    SELECT rc.*, u.username
    FROM review_comments rc
    JOIN users u ON u.id = rc.user_id
    WHERE rc.id = ?
  `).get(result.lastInsertRowid);
    res.status(201).json(comment);
});
router.delete("/:bookId/reviews/:reviewId/comments/:commentId", authMiddleware, (req, res) => {
    const result = db.prepare("DELETE FROM review_comments WHERE id = ? AND user_id = ?").run(req.params.commentId, req.userId);
    if (result.changes === 0) {
        res.status(404).json({ error: "Comment not found or not yours" });
        return;
    }
    res.json({ message: "Comment deleted" });
});
export default router;
