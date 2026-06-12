import { Router } from "express";
import db from "../db.js";
const router = Router();
router.get("/:id", (req, res) => {
    const userId = Number(req.params.id);
    const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    const totalRead = db.prepare("SELECT COUNT(*) as count FROM read_books WHERE user_id = ?").get(userId);
    const currentYear = new Date().getFullYear();
    const readThisYear = db.prepare("SELECT COUNT(*) as count FROM reading_log WHERE user_id = ? AND strftime('%Y', COALESCE(end_date, start_date)) = ?").get(userId, String(currentYear));
    const booksPerYear = db.prepare(`
    SELECT strftime('%Y', COALESCE(end_date, start_date)) as year, COUNT(*) as count
    FROM reading_log WHERE user_id = ?
    GROUP BY year ORDER BY year DESC
  `).all(userId);
    const ratingDistribution = db.prepare(`
    SELECT rating, COUNT(*) as count
    FROM reviews WHERE user_id = ?
    GROUP BY rating ORDER BY rating
  `).all(userId);
    const avgRating = db.prepare("SELECT COALESCE(AVG(rating), 0) as avg FROM reviews WHERE user_id = ?").get(userId);
    const favoriteAuthor = db.prepare(`
    SELECT b.author, COUNT(*) as count
    FROM read_books rb
    JOIN books b ON b.id = rb.book_id
    WHERE rb.user_id = ?
    GROUP BY b.author
    ORDER BY count DESC
    LIMIT 1
  `).get(userId);
    const genreBreakdown = db.prepare(`
    SELECT b.genre, COUNT(*) as count
    FROM read_books rb
    JOIN books b ON b.id = rb.book_id
    WHERE rb.user_id = ? AND b.genre != ''
    GROUP BY b.genre
    ORDER BY count DESC
  `).all(userId);
    const diaryEntries = db.prepare("SELECT COALESCE(end_date, start_date) as date FROM reading_log WHERE user_id = ? ORDER BY date DESC").all(userId);
    let currentStreak = 0;
    if (diaryEntries.length > 0) {
        const dates = [...new Set(diaryEntries.map(e => e.date))].sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        let check = new Date(dates[0]);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - check.getTime()) / 86400000);
        if (diffDays <= 1) {
            currentStreak = 1;
            for (let i = 1; i < dates.length; i++) {
                const prev = new Date(dates[i - 1]);
                const curr = new Date(dates[i]);
                const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
                if (diff === 1) {
                    currentStreak++;
                }
                else {
                    break;
                }
            }
        }
    }
    res.json({
        username: user.username,
        total_read: totalRead.count,
        read_this_year: readThisYear.count,
        books_per_year: booksPerYear,
        rating_distribution: ratingDistribution,
        average_rating: Math.round(avgRating.avg * 10) / 10,
        favorite_author: favoriteAuthor ? favoriteAuthor.author : null,
        current_streak: currentStreak,
        genre_breakdown: genreBreakdown,
    });
});
export default router;
