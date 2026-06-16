import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import booksRouter, { scheduleEnrichment } from "./routes/books.js";
import coversRouter, { prewarmCovers } from "./routes/covers.js";
import authRouter from "./routes/auth.js";
import listsRouter from "./routes/lists.js";
import feedRouter from "./routes/feed.js";
import usersRouter from "./routes/users.js";
import statsRouter from "./routes/stats.js";
import discussionsRouter from "./routes/discussions.js";
import searchRouter from "./routes/search.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use("/api/books", booksRouter);
app.use("/api/covers", coversRouter);
app.use("/api/auth", authRouter);
app.use("/api/lists", listsRouter);
app.use("/api/feed", feedRouter);
app.use("/api/users", usersRouter);
app.use("/api/stats", statsRouter);
app.use("/api/discussions", discussionsRouter);
app.use("/api/search", searchRouter);
// Serve React frontend (production build)
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    setTimeout(() => scheduleEnrichment().catch(console.error), 2000);
    setTimeout(() => prewarmCovers().catch(console.error), 5000);
});
