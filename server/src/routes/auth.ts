import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/register", (req: Request, res: Response) => {
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
  const token = generateToken(result.lastInsertRowid as number);

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, username, bio: "", avatar_url: "" },
  });
});

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as Record<string, unknown> | undefined;
  if (!user || !bcrypt.compareSync(password, user.password as string)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = generateToken(user.id as number);
  res.json({
    token,
    user: { id: user.id, username: user.username, bio: user.bio ?? "", avatar_url: user.avatar_url ?? "" },
  });
});

router.get("/me", authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db
    .prepare("SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?")
    .get(req.userId) as Record<string, unknown> | undefined;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/profile", authMiddleware, (req: AuthRequest, res: Response) => {
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
    .get(req.userId) as Record<string, unknown>;
  res.json(updated);
});

export default router;
