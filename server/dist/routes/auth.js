import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { generateToken, authMiddleware } from "../middleware/auth.js";
const router = Router();
function validateUsername(username) {
    if (!username || username.length < 3 || username.length > 20) {
        return "Username must be between 3 and 20 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return "Username may only contain letters, numbers, and underscores";
    }
    return null;
}
function validatePassword(password) {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character";
    }
    return null;
}
function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address";
    }
    return null;
}
router.post("/register", (req, res) => {
    const { username, email, password } = req.body;
    const usernameError = validateUsername(username);
    if (usernameError) {
        res.status(400).json({ error: usernameError, field: "username" });
        return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
        res.status(400).json({ error: emailError, field: "email" });
        return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
        res.status(400).json({ error: passwordError, field: "password" });
        return;
    }
    const existingUsername = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existingUsername) {
        res.status(409).json({ error: "Username already taken", field: "username" });
        return;
    }
    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase());
    if (existingEmail) {
        res.status(409).json({ error: "An account with this email already exists", field: "email" });
        return;
    }
    const hashed = bcrypt.hashSync(password, 12);
    const result = db
        .prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)")
        .run(username, email.trim().toLowerCase(), hashed);
    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({
        token,
        user: { id: result.lastInsertRowid, username, bio: "", avatar_url: "" },
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
    res.json({
        token,
        user: { id: user.id, username: user.username, bio: user.bio ?? "", avatar_url: user.avatar_url ?? "" },
    });
});
router.get("/me", authMiddleware, (req, res) => {
    const user = db
        .prepare("SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?")
        .get(req.userId);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(user);
});
router.patch("/profile", authMiddleware, (req, res) => {
    const { bio, avatar_url } = req.body;
    if (bio !== undefined) {
        if (typeof bio !== "string" || bio.length > 300) {
            res.status(400).json({ error: "Bio must be 300 characters or fewer" });
            return;
        }
        db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio.trim(), req.userId);
    }
    if (avatar_url !== undefined) {
        if (typeof avatar_url !== "string") {
            res.status(400).json({ error: "Invalid avatar" });
            return;
        }
        if (avatar_url !== "" && !avatar_url.startsWith("data:image/")) {
            res.status(400).json({ error: "Avatar must be an image data URL" });
            return;
        }
        db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatar_url, req.userId);
    }
    const updated = db
        .prepare("SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?")
        .get(req.userId);
    res.json(updated);
});
export default router;
