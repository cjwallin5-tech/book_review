import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "books.db"));

async function main() {
  const titles = ["Rebecca","The Godfather","The Princess Bride","Good Omens","The Time Traveler's Wife"];
  for (const t of titles) {
    const res = await fetch("https://openlibrary.org/search.json?q=" + encodeURIComponent(t) + "&limit=1");
    const data = await res.json();
    const d = data.docs?.[0];
    if (d?.author_name && d?.cover_i) {
      const author = d.author_name[0];
      const existing = db.prepare("SELECT id FROM books WHERE title = ? AND author = ?").get(d.title, author);
      if (existing) { console.log("Exists:", d.title); continue; }
      const cover = "https://covers.openlibrary.org/b/id/" + d.cover_i + "-L.jpg";
      const desc = d.first_sentence?.[0] || "";
      const r = db.prepare("INSERT INTO books (title,author,cover_url,description) VALUES (?,?,?,?)").run(d.title, author, cover, desc);
      console.log("Added:", d.title);
      const bid = r.lastInsertRowid;
      db.prepare("INSERT INTO reviews (book_id,user_name,rating,content) VALUES (?,?,?,?)").run(bid, "Alice", 5, "Absolutely loved this book! A timeless classic.");
      db.prepare("INSERT INTO reviews (book_id,user_name,rating,content) VALUES (?,?,?,?)").run(bid, "Bob", 4, "Really great read. Would recommend to anyone.");
      db.prepare("INSERT INTO reviews (book_id,user_name,rating,content) VALUES (?,?,?,?)").run(bid, "Charlie", 3, "It was okay, not my favorite genre.");
    } else {
      console.log("Skipped:", t);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  db.close();
}
main().catch(console.error);
