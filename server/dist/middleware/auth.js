import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
    }
}
