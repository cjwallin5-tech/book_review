import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { generateToken, authMiddleware } from "../middleware/auth.js";
const router = Router();
router.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "username and password are required" });
        return;
    }
    if (password.length < 4) {
        res.status(400).json({ error: "Password must be at least 4 characters" });
        return;
    }
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        res.status(409).json({ error: "Username already taken" });
        return;
    }
    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashed);
    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({
        token,
        user: { id: result.lastInsertRowid, username },
    });
});
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "username and password are required" });
        return;
    }
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
    }
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username } });
});
router.get("/me", authMiddleware, (req, res) => {
    const user = db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").get(req.userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(user);
});
export default router;
