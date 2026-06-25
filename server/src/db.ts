import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "books.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating REAL NOT NULL CHECK(rating >= 0.5 AND rating <= 5),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tbr_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, book_id)
  );

  CREATE TABLE IF NOT EXISTS read_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, book_id)
  );

  CREATE TABLE IF NOT EXISTS reading_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    start_date TEXT,
    end_date TEXT,
    format TEXT NOT NULL DEFAULT 'paperback',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS list_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(list_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS review_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(review_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS list_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discussion_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discussion_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES discussion_categories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    post_count INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discussion_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrate existing databases
const reviewsCols = db.pragma("table_info(reviews)") as { name: string }[];
if (!reviewsCols.find((c) => c.name === "user_id")) {
  db.exec("ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
}

const listsCols = db.pragma("table_info(lists)") as { name: string }[];
if (!listsCols.find((c) => c.name === "is_private")) {
  db.exec("ALTER TABLE lists ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0");
}

const booksCols = db.pragma("table_info(books)") as { name: string }[];
if (!booksCols.find((c) => c.name === "genre")) {
  db.exec("ALTER TABLE books ADD COLUMN genre TEXT NOT NULL DEFAULT ''");
}
if (!booksCols.find((c) => c.name === "country")) {
  db.exec("ALTER TABLE books ADD COLUMN country TEXT NOT NULL DEFAULT ''");
}

// Track enrichment version so we can reset and re-run when logic improves
db.exec("CREATE TABLE IF NOT EXISTS _enrichment_state (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '')");
const enrichV = db.prepare("SELECT value FROM _enrichment_state WHERE key = 'country_version'").get() as { value: string } | undefined;
if (enrichV?.value !== 'v3') {
  db.exec("UPDATE books SET country = '', genre = ''");
  db.prepare("INSERT OR REPLACE INTO _enrichment_state (key, value) VALUES ('country_version', 'v3')").run();
}

const readingLogCols = db.pragma("table_info(reading_log)") as { name: string }[];
if (!readingLogCols.find((c) => c.name === "start_date")) {
  // Recreate reading_log with new schema, migrating old data
  db.exec("ALTER TABLE reading_log RENAME TO reading_log_old");
  db.exec(`
    CREATE TABLE reading_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      start_date TEXT,
      end_date TEXT,
      format TEXT NOT NULL DEFAULT 'paperback',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec("INSERT INTO reading_log (id, user_id, book_id, start_date, format, created_at) SELECT id, user_id, book_id, date, format, created_at FROM reading_log_old");
  db.exec("DROP TABLE reading_log_old");
}

// Drop reading_journal table if it exists (safe to run every time)
db.exec("DROP TABLE IF EXISTS reading_journal");

// Add bio, avatar_url, and email to users if missing
const userProfileCols = db.pragma("table_info(users)") as { name: string }[];
if (!userProfileCols.find((c) => c.name === "bio")) {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''");
}
if (!userProfileCols.find((c) => c.name === "avatar_url")) {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''");
}
if (!userProfileCols.find((c) => c.name === "email")) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''");
}

// Migrate rating column from INTEGER to REAL to support half-star ratings (0.5 increments)
const ratingColType = (db.pragma("table_info(reviews)") as { name: string; type: string }[])
  .find((c) => c.name === "rating")?.type;
if (ratingColType === "INTEGER") {
  db.pragma("foreign_keys = OFF");
  db.exec(`
    ALTER TABLE reviews RENAME TO reviews_integer_backup;
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT NOT NULL,
      rating REAL NOT NULL CHECK(rating >= 0.5 AND rating <= 5),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO reviews SELECT * FROM reviews_integer_backup;
    DROP TABLE reviews_integer_backup;
  `);
  db.pragma("foreign_keys = ON");
}

// Add favorite_books table if missing
db.exec(`
  CREATE TABLE IF NOT EXISTS favorite_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK(position >= 1 AND position <= 4),
    UNIQUE(user_id, position),
    UNIQUE(user_id, book_id)
  )
`);

// Add reading_progress table
db.exec(`
  CREATE TABLE IF NOT EXISTS reading_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    current_page INTEGER NOT NULL DEFAULT 0,
    total_pages INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, book_id)
  )
`);

// Add user_challenges table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    target INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, type, year)
  )
`);

// Ensure series columns exist (safe to re-run)
const booksColsV2 = db.pragma("table_info(books)") as { name: string }[];
if (!booksColsV2.find((c) => c.name === "series")) {
  db.exec("ALTER TABLE books ADD COLUMN series TEXT");
}
if (!booksColsV2.find((c) => c.name === "series_order")) {
  db.exec("ALTER TABLE books ADD COLUMN series_order NUMERIC NOT NULL DEFAULT 0");
}

// Seed default discussion categories if empty
const existingCategories = db.prepare("SELECT COUNT(*) as count FROM discussion_categories").get() as { count: number };
if (existingCategories.count === 0) {
  const insert = db.prepare("INSERT INTO discussion_categories (name, description, position) VALUES (?, ?, ?)");
  insert.run("General", "General book discussion and chat", 1);
  insert.run("Book Reviews", "Share and discuss book reviews", 2);
  insert.run("Recommendations", "Ask for and give book recommendations", 3);
  insert.run("Reading Challenges", "Discuss reading challenges and goals", 4);
}

export default db;
