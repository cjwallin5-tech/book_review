import { Router } from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
function getUserIdFromReq(req) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
        return undefined;
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, JWT_SECRET);
        return payload.userId;
    }
    catch {
        return undefined;
    }
}
const router = Router();
router.get("/:id", (req, res) => {
    const user = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").get(req.params.id);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    const followers = db.prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?").get(user.id);
    const following = db.prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?").get(user.id);
    const readCount = db.prepare("SELECT COUNT(*) as count FROM read_books WHERE user_id = ?").get(user.id);
    const reviewCount = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE user_id = ?").get(user.id);
    let isFollowing = false;
    const currentUserId = getUserIdFromReq(req);
    if (currentUserId && currentUserId !== user.id) {
        const follow = db.prepare("SELECT id FROM follows WHERE follower_id = ? AND following_id = ?").get(currentUserId, user.id);
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
router.post("/:id/follow", authMiddleware, (req, res) => {
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
    }
    catch {
        res.status(409).json({ error: "Already following" });
    }
});
router.delete("/:id/follow", authMiddleware, (req, res) => {
    db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(req.userId, req.params.id);
    res.json({ message: "Unfollowed" });
});
export default router;
