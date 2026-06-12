import db from "./db.js";

// ── Text-only fixes (right cover, wrong title or author text) ─────────────────
const updates: [string, number][] = [
  ["UPDATE books SET title = 'The Alchemist' WHERE id = 277", 277],
  ["UPDATE books SET title = 'The Hitchhiker''s Guide to the Galaxy' WHERE id = 278", 278],
  ["UPDATE books SET title = 'One Hundred Years of Solitude' WHERE id = 281", 281],
  ["UPDATE books SET title = '1984', author = 'George Orwell' WHERE id = 283", 283],
  ["UPDATE books SET title = 'The Three Musketeers' WHERE id = 284", 284],
  ["UPDATE books SET title = 'The Count of Monte Cristo' WHERE id = 285", 285],
  ["UPDATE books SET title = 'The Woman in the Window' WHERE id = 288", 288],
  ["UPDATE books SET author = 'Homer' WHERE id = 290", 290],
  ["UPDATE books SET author = 'Leo Tolstoy' WHERE id = 291", 291],
  ["UPDATE books SET author = 'Fyodor Dostoevsky' WHERE id = 292", 292],
];

for (const [sql] of updates) {
  db.prepare(sql).run();
}

// Fix Crime and Punishment translator listed as author
db.prepare("UPDATE books SET author = 'Fyodor Dostoevsky' WHERE title = 'Crime and Punishment' AND author = 'Michael R. Katz'").run();

// Fix Three-Body Problem duplicates: one becomes book 1, one becomes book 2
db.prepare("UPDATE books SET title = 'The Three-Body Problem', author = 'Liu Cixin', series = 'Remembrance of Earth''s Past', series_order = 1 WHERE id = 286").run();
db.prepare("UPDATE books SET title = 'The Dark Forest', author = 'Liu Cixin', series = 'Remembrance of Earth''s Past', series_order = 2 WHERE id = 287").run();

// ── Delete completely wrong entries ───────────────────────────────────────────
// 279 = Isaac Asimov omnibus collection (not I, Robot)
// 280 = verbose 18th-century Don Quixote title
db.prepare("DELETE FROM books WHERE id IN (279, 280)").run();
console.log("Deleted wrong entries (ids 279, 280).");

// ── Insert clean replacement entries ─────────────────────────────────────────
const ins = db.prepare(
  "INSERT INTO books (title, author, cover_url, description, genre) VALUES (?, ?, ?, ?, ?)"
);

const toAdd = [
  {
    title: "I, Robot",
    author: "Isaac Asimov",
    cover_url: "https://covers.openlibrary.org/b/id/8235429-L.jpg",
    description:
      "A collection of nine linked short stories tracing the development of robot technology from simple household machines to beings of vast intelligence. Through these tales Asimov explores the Three Laws of Robotics and the surprising paradoxes that arise when logic meets human complexity.",
    genre: "Science Fiction",
  },
  {
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    cover_url: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    description:
      "Alonso Quijano, a country gentleman who has read so many chivalric romances that he loses his sanity, sets out as the knight-errant Don Quixote de la Mancha with his loyal squire Sancho Panza to revive chivalry and right wrongs. Widely regarded as the first modern novel and one of the greatest works of fiction ever written.",
    genre: "Literary Fiction",
  },
  {
    title: "The Shadow of the Wind",
    author: "Carlos Ruiz Zafón",
    cover_url: "https://covers.openlibrary.org/b/id/8120459-L.jpg",
    description:
      "Set in post-war Barcelona, young Daniel Sempere discovers a haunting novel by Julián Carax in the secret Cemetery of Forgotten Books. When he tries to find other works by the author he learns that a mysterious figure has been hunting down and burning every copy of Carax's books — and Daniel's own life begins to mirror the story he has read.",
    genre: "Mystery",
  },
  {
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    cover_url: "https://covers.openlibrary.org/b/id/8227685-L.jpg",
    description:
      "Ove is a curmudgeonly fifty-nine-year-old who enforces neighborhood rules with iron precision. When a young family accidentally flattens his mailbox and moves in next door, Ove is reluctantly drawn into a series of unlikely friendships that force him to reckon with his past and discover that life may still hold something worth living for.",
    genre: "Fiction",
  },
];

const existsByTitle = db.prepare("SELECT id FROM books WHERE lower(title) = lower(?)");

for (const book of toAdd) {
  if (existsByTitle.get(book.title)) {
    console.log(`Already exists: "${book.title}"`);
    continue;
  }
  ins.run(book.title, book.author, book.cover_url, book.description, book.genre);
  console.log(`Added: "${book.title}" by ${book.author}`);
}

// ── Final verification ────────────────────────────────────────────────────────
console.log("\nTotal books:", (db.prepare("SELECT COUNT(*) as n FROM books").get() as any).n);

const bad = db.prepare(`
  SELECT id, title, author FROM books WHERE
    author LIKE '%μ%' OR author LIKE '%ол%' OR author LIKE '%ост%'
    OR author = '刘慈欣'
    OR title LIKE '%(adaptation)%'
    OR title LIKE '%Graphic Novel%'
    OR title LIKE '%Cien a%'
    OR title LIKE '%La mujer%'
    OR title LIKE '%Monte-Cristo%'
    OR title LIKE '%Ingenious Gentleman%'
`).all() as any[];

if (bad.length === 0) {
  console.log("✓ No remaining foreign-language or wrong-edition entries.");
} else {
  console.log("Still problematic:");
  bad.forEach((b) => console.log(` - [${b.id}] ${b.title} | ${b.author}`));
}
