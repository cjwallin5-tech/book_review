import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

// ── Open Library enrichment v2 ────────────────────────────────────────────
// Country: derived from author's birth_place (much more accurate than publish_country)
// Genre:   regex scan across ALL subjects in priority order

// Patterns checked against every subject string; first match wins
const GENRE_MAP: [RegExp, string][] = [
  [/\bscience fiction\b|\bsci-fi\b|\bscifi\b|\bspace opera\b|\bcyberpunk\b|\bsteampunk\b|\bdystop|\bpost-apocalyptic\b|\btime travel\b/i, "Science Fiction"],
  [/\bfantasy\b|\bmagic realism\b|\bmagical realism\b|\bwizard\b|\bdragon\b|\bhigh fantasy\b|\bepic fantasy\b|\bdark fantasy\b/i, "Fantasy"],
  [/\bhorror\b|\bgothic fiction\b|\bsupernatural fiction\b|\bvampire\b|\bzombie\b|\bhaunt/i, "Horror"],
  [/\bmystery\b|\bdetective\b|\bwhodunit\b|\bcozy mystery\b|\bsleuthing\b/i, "Mystery"],
  [/\bthriller\b|\bsuspense\b|\bspy fiction\b|\bespionage\b|\bpsychological thriller\b|\bpolitical thriller\b/i, "Thriller"],
  [/\bromance\b|\bromantic fiction\b|\blove stor\b|\bchick lit\b|\berotica\b/i, "Romance"],
  [/\bhistorical fiction\b|\bhistorical novel\b/i, "Historical Fiction"],
  [/\badventure fiction\b|\badventure stories\b|\baction.adventure\b/i, "Adventure"],
  [/\bcrime fiction\b|\bnoir\b|\bhard-boiled\b|\bheist\b/i, "Crime"],
  [/\byoung adult\b|\bteen fiction\b|\bya fiction\b|\bjuvenile fiction\b/i, "Young Adult"],
  [/\bchildren'?s\b|\bpicture book\b|\bmiddle grade\b|\bchildren'?s fiction\b/i, "Children"],
  [/\bbiograph\b|\bautobiograph\b/i, "Biography"],
  [/\bmemoir\b/i, "Memoir"],
  [/\bworld history\b|\bhistory\b|\bhistorical study\b/i, "History"],
  [/\bpoetry\b|\bpoems?\b|\bverse\b/i, "Poetry"],
  [/\bdrama\b|\bplay\b|\btheater\b|\btheatre\b|\bstage\b/i, "Drama"],
  [/\bself-help\b|\bself help\b|\bpersonal development\b|\bproductivity\b|\bmotivation\b/i, "Self-Help"],
  [/\bphilosoph\b/i, "Philosophy"],
  [/\bpsycholog\b|\bpsychiatry\b/i, "Psychology"],
  [/\bgraphic novel\b|\bcomic book\b|\bmanga\b/i, "Graphic Novel"],
  [/\bnonfiction\b|\bnon-fiction\b|\bessay\b|\bjournalism\b|\bdocumentary\b/i, "Non-Fiction"],
  [/\bliterary fiction\b|\bfiction\b|\bnovel\b/i, "Fiction"],
];

// Curated author-nationality map (literary nationality, not birth country)
// Keys are the exact DB author string lowercased.
const AUTHOR_NATIONALITY: Record<string, string> = {
  "a. a. milne": "United Kingdom",
  "a.j. finn": "United States",
  "agatha christie": "United Kingdom",
  "alan garner": "United Kingdom",
  "aldous huxley": "United Kingdom",
  "alex michaelides": "United Kingdom",
  "alexandre dumas": "France",
  "alexis hall": "United Kingdom",
  "alice walker": "United States",
  "amor towles": "United States",
  "amy tan": "United States",
  "andrea levy": "United Kingdom",
  "andrew sean greer": "United States",
  "andy weir": "United States",
  "angie thomas": "United States",
  "ann patchett": "United States",
  "anne brontë": "United Kingdom",
  "anne frank": "Netherlands",
  "anthony burgess": "United Kingdom",
  "anthony doerr": "United States",
  "anton chekhov": "Russia",
  "arthur golden": "United States",
  "ashley audrain": "Canada",
  "atul gawande": "United States",
  "audrey niffenegger": "United States",
  "b.a. paris": "United Kingdom",
  "bessel van der kolk": "Netherlands",
  "beth o'leary": "United Kingdom",
  "blake crouch": "United States",
  "bonnie garmus": "United States",
  "boris pasternak": "Russia",
  "bram stoker": "Ireland",
  "brandon sanderson": "United States",
  "brit bennett": "United States",
  "c. s. lewis": "United Kingdom",
  "caleb azumah nelson": "United Kingdom",
  "candice carty-williams": "United Kingdom",
  "carlos ruiz zafón": "Spain",
  "casey mcquiston": "United States",
  "celeste ng": "United States",
  "charles dickens": "United Kingdom",
  "charles duhigg": "United States",
  "charlotte brontë": "United Kingdom",
  "cheryl strayed": "United States",
  "chimamanda ngozi adichie": "Nigeria",
  "china miéville": "United Kingdom",
  "chuck palahniuk": "United States",
  "colleen hoover": "United States",
  "cormac mccarthy": "United States",
  "dan brown": "United States",
  "dan simmons": "United States",
  "daniel kahneman": "Israel",
  "daniel keyes": "United States",
  "daphne du maurier": "United Kingdom",
  "dashiell hammett": "United States",
  "david nicholls": "United Kingdom",
  "delia owens": "United States",
  "don delillo": "United States",
  "donna tartt": "United States",
  "dorothy l. sayers": "United Kingdom",
  "douglas adams": "United Kingdom",
  "e. b. white": "United States",
  "e. l. konigsburg": "United States",
  "e. m. forster": "United Kingdom",
  "elena armas": "Spain",
  "elie wiesel": "United States",
  "elizabeth gaskell": "United Kingdom",
  "elizabeth george speare": "United States",
  "elizabeth strout": "United States",
  "ellen raskin": "United States",
  "emily brontë": "United Kingdom",
  "emily henry": "United States",
  "emily st. john mandel": "Canada",
  "erin morgenstern": "United States",
  "ernest cline": "United States",
  "ernest hemingway": "United States",
  "f. scott fitzgerald": "United States",
  "frances hodgson burnett": "United Kingdom",
  "frank herbert": "United States",
  "fred gipson": "United States",
  "fredrik backman": "Sweden",
  "fyodor dostoevsky": "Russia",
  "gabriel garcía márquez": "Colombia",
  "gabrielle zevin": "United States",
  "gail honeyman": "United Kingdom",
  "george eliot": "United Kingdom",
  "george orwell": "United Kingdom",
  "george r. r. martin": "United States",
  "george saunders": "United States",
  "gillian flynn": "United States",
  "graham greene": "United Kingdom",
  "greer hendricks": "United States",
  "h. g. wells": "United Kingdom",
  "han kang": "South Korea",
  "hanya yanagihara": "United States",
  "harper lee": "United States",
  "heather morris": "New Zealand",
  "helen macdonald": "United Kingdom",
  "herman melville": "United States",
  "holly black": "United States",
  "homer": "Greece",
  "hugh howey": "United States",
  "isaac asimov": "United States",
  "ivan goncharov": "Russia",
  "ivan turgenev": "Russia",
  "j. d. salinger": "United States",
  "j. d. vance": "United States",
  "j. k. rowling": "United Kingdom",
  "j. m. barrie": "United Kingdom",
  "j. r. r. tolkien": "United Kingdom",
  "j.r.r. tolkien": "United Kingdom",
  "jack kerouac": "United States",
  "jack london": "United States",
  "james clear": "United States",
  "james dashner": "United States",
  "james thurber": "United States",
  "jane austen": "United Kingdom",
  "jane langton": "United States",
  "jared m. diamond": "United States",
  "jeannette walls": "United States",
  "jerry spinelli": "United States",
  "joan aiken": "United Kingdom",
  "joan didion": "United States",
  "john bellairs": "United States",
  "john buchan": "United Kingdom",
  "john carreyrou": "United States",
  "john green": "United States",
  "john scalzi": "United States",
  "john steinbeck": "United States",
  "jojo moyes": "United Kingdom",
  "jon krakauer": "United States",
  "joseph heller": "United States",
  "josie silver": "United Kingdom",
  "karin slaughter": "United States",
  "katherine arden": "United States",
  "katherine paterson": "United States",
  "kazuo ishiguro": "United Kingdom",
  "kenneth grahame": "United Kingdom",
  "khaled hosseini": "United States",
  "kiley reid": "United States",
  "kirsty greenwood": "United Kingdom",
  "kristin hannah": "United States",
  "kurt vonnegut": "United States",
  "l. frank baum": "United States",
  "leigh bardugo": "United States",
  "leo tolstoy": "Russia",
  "lev grossman": "United States",
  "lewis carroll": "United Kingdom",
  "liane moriarty": "Australia",
  "liu cixin": "China",
  "liv constantine": "United States",
  "lois lowry": "United States",
  "louis sachar": "United States",
  "louisa may alcott": "United States",
  "lucy maud montgomery": "Canada",
  "m. l. wang": "United States",
  "madeleine l'engle": "United States",
  "madeline miller": "United States",
  "margaret atwood": "Canada",
  "margaret mitchell": "United States",
  "mario puzo": "United States",
  "mark twain": "United States",
  "markus zusak": "Australia",
  "mary norton": "United Kingdom",
  "mary shelley": "United Kingdom",
  "matt haig": "United Kingdom",
  "maxim gorky": "Russia",
  "michael bond": "United Kingdom",
  "michael crichton": "United States",
  "michelle obama": "United States",
  "mieko kawakami": "Japan",
  "miguel de cervantes": "Spain",
  "mikhail bulgakov": "Russia",
  "min jin lee": "United States",
  "naomi novik": "United States",
  "nathaniel hawthorne": "United States",
  "neal stephenson": "United States",
  "neil gaiman": "United Kingdom",
  "nicholas sparks": "United States",
  "nikolai gogol": "Russia",
  "norton juster": "United States",
  "orson scott card": "United States",
  "oscar wilde": "Ireland",
  "patrick rothfuss": "United States",
  "patti smith": "United States",
  "paul kalanithi": "United States",
  "paula hawkins": "United Kingdom",
  "paulo coelho": "Brazil",
  "phyllis reynolds naylor": "United States",
  "pierce brown": "United States",
  "pseudonymous bosch": "United States",
  "r. f. kuang": "United States",
  "ray bradbury": "United States",
  "raymond chandler": "United States",
  "rebecca yarros": "United States",
  "richard adams": "United Kingdom",
  "richard dawkins": "United Kingdom",
  "richard osman": "United Kingdom",
  "richard powers": "United States",
  "richard wright": "United States",
  "ross macdonald": "United States",
  "s. a. chakraborty": "United States",
  "s. e. hinton": "United States",
  "sabaa tahir": "United States",
  "sally rooney": "Ireland",
  "sally thorne": "Australia",
  "samantha shannon": "United Kingdom",
  "sandra cisneros": "United States",
  "sarah j. maas": "United States",
  "sayaka murata": "Japan",
  "scott hawkins": "United States",
  "scott o'dell": "United States",
  "sharon creech": "United States",
  "siddhartha mukherjee": "United States",
  "stephen chbosky": "United States",
  "stephen hawking": "United Kingdom",
  "stephen king": "United States",
  "stephenie meyer": "United States",
  "stieg larsson": "Sweden",
  "susan cooper": "United Kingdom",
  "susanna clarke": "United Kingdom",
  "suzanne collins": "United States",
  "ta-nehisi coates": "United States",
  "tana french": "Ireland",
  "tara westover": "United States",
  "tasha suri": "United Kingdom",
  "taylor jenkins reid": "United States",
  "terry pratchett": "United Kingdom",
  "thomas hardy": "United Kingdom",
  "tomi adeyemi": "United States",
  "toni morrison": "United States",
  "toshikazu kawaguchi": "Japan",
  "trenton lee stewart": "United States",
  "trevor noah": "South Africa",
  "truman capote": "United States",
  "ursula k. le guin": "United States",
  "v. e. schwab": "United States",
  "v.e. schwab": "United States",
  "veronica roth": "United States",
  "victor hugo": "France",
  "william gibson": "United States",
  "william goldman": "United States",
  "william h. armstrong": "United States",
  "wilson rawls": "United States",
  "yaa gyasi": "United States",
  "yann martel": "Canada",
  "yuval noah harari": "Israel",
  "zadie smith": "United Kingdom",
  "zen cho": "Malaysia",
  "zilpha keatley snyder": "United States",
};

function extractGenre(subjects: string[]): string {
  for (const [pattern, genre] of GENRE_MAP) {
    if (subjects.some((s) => pattern.test(s))) return genre;
  }
  return "";
}

interface OLSearchDoc {
  subject?: string[];
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function safeFetch(url: string): Promise<globalThis.Response | null> {
  try {
    return await globalThis.fetch(url, { signal: AbortSignal.timeout(9000) });
  } catch {
    return null;
  }
}

async function enrichBook(bookId: number, title: string, author: string): Promise<void> {
  try {
    // Country: instant lookup from curated map (no API call needed)
    const country = AUTHOR_NATIONALITY[author.toLowerCase()] ?? "";

    // Genre: fetch subjects from Open Library
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1&fields=subject`;
    const searchRes = await safeFetch(searchUrl);
    let genre = "";
    if (searchRes?.ok) {
      const searchData = await searchRes.json() as { docs?: OLSearchDoc[] };
      if (searchData.docs?.length) {
        genre = extractGenre(searchData.docs[0].subject ?? []);
      }
    }

    const current = db.prepare("SELECT genre, country FROM books WHERE id = ?").get(bookId) as
      | { genre: string; country: string }
      | undefined;
    if (!current) return;

    const setCountry = country && !current.country;
    const setGenre = genre && !current.genre;
    if (!setCountry && !setGenre) return;

    if (setCountry && setGenre) {
      db.prepare("UPDATE books SET country = ?, genre = ? WHERE id = ?").run(country, genre, bookId);
    } else if (setCountry) {
      db.prepare("UPDATE books SET country = ? WHERE id = ?").run(country, bookId);
    } else {
      db.prepare("UPDATE books SET genre = ? WHERE id = ?").run(genre, bookId);
    }
  } catch {
    // Skip failures silently
  }
}

export async function scheduleEnrichment(): Promise<void> {
  // Pass 1: set countries instantly from curated map (no API calls)
  const noCountry = db
    .prepare("SELECT id, author FROM books WHERE country = '' OR country IS NULL")
    .all() as { id: number; author: string }[];
  let countriesSet = 0;
  for (const book of noCountry) {
    const country = AUTHOR_NATIONALITY[book.author.toLowerCase()] ?? "";
    if (country) {
      db.prepare("UPDATE books SET country = ? WHERE id = ?").run(country, book.id);
      countriesSet++;
    }
  }
  if (countriesSet) console.log(`[enrich] Set ${countriesSet} countries from curated map.`);

  // Pass 2: fetch genre from Open Library for books still missing it
  const noGenre = db
    .prepare("SELECT id, title, author FROM books WHERE genre = '' OR genre IS NULL")
    .all() as { id: number; title: string; author: string }[];
  if (!noGenre.length) { console.log("[enrich] All genres already set."); return; }
  console.log(`[enrich] Fetching genres for ${noGenre.length} books via Open Library…`);

  for (const book of noGenre) {
    await enrichBook(book.id, book.title, book.author);
    await delay(300);
  }
  console.log("[enrich] Done.");
}

// ── Router ─────────────────────────────────────────────────────────────────

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { author, sort } = req.query;
  let sql: string;
  let params: unknown[];

  if (author && typeof author === "string") {
    sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      WHERE b.author = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
    params = [author];
  } else if (sort === "rating") {
    sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      HAVING review_count > 0
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT 100
    `;
    params = [];
  } else if (sort === "trending") {
    sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY (
        (SELECT COUNT(*) FROM reviews WHERE book_id = b.id AND created_at > datetime('now', '-30 days')) +
        (SELECT COUNT(*) FROM reading_log WHERE book_id = b.id AND created_at > datetime('now', '-30 days')) +
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id AND created_at > datetime('now', '-30 days')) * 2
      ) DESC, read_count DESC
      LIMIT 14
    `;
    params = [];
  } else {
    sql = `
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
      FROM books b
      LEFT JOIN reviews r ON r.book_id = b.id
      GROUP BY b.id
      ORDER BY read_count DESC, b.created_at DESC
    `;
    params = [];
  }

  const books = db.prepare(sql).all(...params);
  res.json(books);
});

router.get("/:id", (req: Request, res: Response) => {
  const book = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM books b
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
  `).get(req.params.id) as Record<string, unknown> | undefined;

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const rawReviews = db.prepare(
    "SELECT * FROM reviews WHERE book_id = ? ORDER BY created_at DESC"
  ).all(req.params.id) as any[];

  let userId: number | undefined;
  if (req.headers.authorization) {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || "book-review-secret-key";
      const token = (req.headers.authorization as string).slice(7);
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = payload.userId;
    } catch {}
  }

  const reviews = rawReviews.map((r) => {
    const likeCount = db.prepare(
      "SELECT COUNT(*) as count FROM review_likes WHERE review_id = ?"
    ).get(r.id) as { count: number };

    const commentCount = db.prepare(
      "SELECT COUNT(*) as count FROM review_comments WHERE review_id = ?"
    ).get(r.id) as { count: number };

    let isLiked = false;
    if (userId) {
      const like = db.prepare(
        "SELECT id FROM review_likes WHERE review_id = ? AND user_id = ?"
      ).get(r.id, userId);
      isLiked = !!like;
    }

    return {
      ...r,
      like_count: likeCount.count,
      comment_count: commentCount.count,
      is_liked: isLiked,
    };
  });

  // Include other books in the same series (ordered by series_order)
  const seriesName = book.series as string;
  const seriesBooks = seriesName
    ? (db.prepare(`
        SELECT b.id, b.title, b.cover_url, b.series_order,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM books b
        LEFT JOIN reviews r ON r.book_id = b.id
        WHERE b.series = ? AND b.id != ?
        GROUP BY b.id
        ORDER BY b.series_order ASC, b.title ASC
      `).all(seriesName, req.params.id) as any[])
    : [];

  // Current user's rating for this book (rating-only or full review)
  let userRating: number | null = null;
  if (userId) {
    const row = db.prepare(
      "SELECT rating FROM reviews WHERE book_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).get(req.params.id, userId) as { rating: number } | undefined;
    userRating = row?.rating ?? null;
  }

  res.json({ ...book, reviews, series_books: seriesBooks, user_rating: userRating });
});

router.post("/", async (req: Request, res: Response) => {
  const { title, author, cover_url, description } = req.body;

  if (!title || !author || !cover_url) {
    res.status(400).json({ error: "title, author, and cover_url are required" });
    return;
  }

  const result = db.prepare(
    "INSERT INTO books (title, author, cover_url, description) VALUES (?, ?, ?, ?)"
  ).run(title, author, cover_url, description || "");

  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(result.lastInsertRowid) as { id: number; title: string; author: string };
  res.status(201).json(book);

  // Enrich in background — don't delay the response
  enrichBook(book.id, book.title, book.author).catch(() => {});
});

router.post("/:id/reviews", authMiddleware, (req: AuthRequest, res: Response) => {
  const { rating, content = "" } = req.body;

  if (typeof rating !== "number" || rating < 0.5 || rating > 5) {
    res.status(400).json({ error: "rating must be a number between 0.5 and 5" });
    return;
  }

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(req.params.id);
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(req.userId) as { id: number; username: string } | undefined;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const trimmedContent = (content as string).trim();
  let reviewId: number;

  if (trimmedContent === "") {
    // Rating-only: upsert so the user has at most one rating-only entry per book
    const existing = db.prepare(
      "SELECT id FROM reviews WHERE book_id = ? AND user_id = ? AND content = ''"
    ).get(req.params.id, user.id) as { id: number } | undefined;

    if (existing) {
      db.prepare("UPDATE reviews SET rating = ? WHERE id = ?").run(rating, existing.id);
      reviewId = existing.id;
    } else {
      const result = db.prepare(
        "INSERT INTO reviews (book_id, user_id, user_name, rating, content) VALUES (?, ?, ?, ?, '')"
      ).run(req.params.id, user.id, user.username, rating);
      reviewId = result.lastInsertRowid as number;
    }
  } else {
    // Full review with text
    const result = db.prepare(
      "INSERT INTO reviews (book_id, user_id, user_name, rating, content) VALUES (?, ?, ?, ?, ?)"
    ).run(req.params.id, user.id, user.username, rating, trimmedContent);
    reviewId = result.lastInsertRowid as number;
  }

  // Automatically mark book as read
  db.prepare("INSERT OR IGNORE INTO read_books (user_id, book_id) VALUES (?, ?)").run(user.id, req.params.id);

  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(reviewId);
  res.status(201).json(review);
});

// --- User-specific authenticated routes ---

router.get("/tbr/list", authMiddleware, (req: AuthRequest, res: Response) => {
  const books = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM tbr_books tb
    JOIN books b ON b.id = tb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE tb.user_id = ?
    GROUP BY b.id
    ORDER BY tb.created_at DESC
  `).all(req.userId);
  res.json(books);
});

router.get("/:id/tbr", authMiddleware, (req: AuthRequest, res: Response) => {
  const row = db.prepare("SELECT 1 FROM tbr_books WHERE user_id = ? AND book_id = ?").get(req.userId, req.params.id);
  res.json({ inTbr: !!row });
});

router.post("/:id/tbr", authMiddleware, (req: AuthRequest, res: Response) => {
  const bookId = Number(req.params.id);
  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }

  try {
    db.prepare("INSERT INTO tbr_books (user_id, book_id) VALUES (?, ?)").run(req.userId, bookId);
    res.status(201).json({ message: "Added to TBR" });
  } catch {
    res.status(409).json({ error: "Book already in TBR" });
  }
});

router.delete("/:id/tbr", authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM tbr_books WHERE user_id = ? AND book_id = ?").run(req.userId, req.params.id);
  res.json({ message: "Removed from TBR" });
});

router.get("/friends/reading", authMiddleware, (req: AuthRequest, res: Response) => {
  const books = db.prepare(`
    SELECT b.*,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count,
      MAX(rb.created_at) as last_activity
    FROM read_books rb
    JOIN follows f ON f.following_id = rb.user_id AND f.follower_id = ?
    JOIN books b ON b.id = rb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    GROUP BY b.id
    ORDER BY last_activity DESC
    LIMIT 50
  `).all(req.userId);
  res.json(books);
});

router.get("/read/list", authMiddleware, (req: AuthRequest, res: Response) => {
  const books = db.prepare(`
    SELECT b.*, COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
    FROM read_books rb
    JOIN books b ON b.id = rb.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE rb.user_id = ?
    GROUP BY b.id
    ORDER BY rb.created_at DESC
  `).all(req.userId);
  res.json(books);
});

router.post("/:id/read", authMiddleware, (req: AuthRequest, res: Response) => {
  const bookId = Number(req.params.id);
  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }

  try {
    db.prepare("INSERT INTO read_books (user_id, book_id) VALUES (?, ?)").run(req.userId, bookId);
    res.status(201).json({ message: "Marked as read" });
  } catch {
    db.prepare("DELETE FROM read_books WHERE user_id = ? AND book_id = ?").run(req.userId, bookId);
    res.json({ message: "Unmarked as read" });
  }
});

router.get("/:id/read-status", authMiddleware, (req: AuthRequest, res: Response) => {
  const entry = db.prepare("SELECT id FROM read_books WHERE user_id = ? AND book_id = ?").get(req.userId, req.params.id);
  res.json({ read: !!entry });
});

// --- Diary ---

router.get("/diary/list", authMiddleware, (req: AuthRequest, res: Response) => {
  const entries = db.prepare(`
    SELECT rl.*, b.title, b.author, b.cover_url
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    WHERE rl.user_id = ?
    ORDER BY COALESCE(rl.end_date, rl.start_date) DESC, rl.created_at DESC
  `).all(req.userId);
  res.json(entries);
});

router.post("/:id/diary", authMiddleware, (req: AuthRequest, res: Response) => {
  const { start_date, end_date, format } = req.body;
  const bookId = Number(req.params.id);

  if (!start_date) {
    res.status(400).json({ error: "start_date is required" });
    return;
  }

  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }

  const result = db.prepare(
    "INSERT INTO reading_log (user_id, book_id, start_date, end_date, format) VALUES (?, ?, ?, ?, ?)"
  ).run(req.userId, bookId, start_date, end_date || null, format || "paperback");

  const entry = db.prepare(`
    SELECT rl.*, b.title, b.author, b.cover_url
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    WHERE rl.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(entry);
});

router.delete("/diary/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const result = db.prepare("DELETE FROM reading_log WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json({ message: "Entry removed" });
});

// --- Open Library search ---

router.get("/search/open-library", async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || !q.trim()) {
    res.status(400).json({ error: "Query parameter q is required" });
    return;
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=key,title,author_name,first_sentence,cover_i,subject_facet,language`;
    const response = await fetch(url);
    const data = await response.json() as { docs: Record<string, unknown>[] };

    const results = data.docs
      .filter((d: any) => d.title && d.author_name && d.cover_i && d.language?.includes("eng"))
      .map((d: any) => ({
        title: d.title,
        author: d.author_name[0],
        cover_url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
        description: d.first_sentence?.[0] || "",
        olid: d.key,
      }));

    res.json(results);
  } catch {
    res.status(500).json({ error: "Failed to search Open Library" });
  }
});

// --- Review likes ---

router.post("/:bookId/reviews/:reviewId/like", authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    db.prepare("INSERT INTO review_likes (review_id, user_id) VALUES (?, ?)").run(req.params.reviewId, req.userId);
    res.status(201).json({ message: "Liked" });
  } catch {
    res.status(409).json({ error: "Already liked" });
  }
});

router.delete("/:bookId/reviews/:reviewId/like", authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare("DELETE FROM review_likes WHERE review_id = ? AND user_id = ?").run(req.params.reviewId, req.userId);
  res.json({ message: "Unliked" });
});

// --- Review comments ---

router.get("/:bookId/reviews/:reviewId/comments", (req: Request, res: Response) => {
  const comments = db.prepare(`
    SELECT rc.*, u.username
    FROM review_comments rc
    JOIN users u ON u.id = rc.user_id
    WHERE rc.review_id = ?
    ORDER BY rc.created_at ASC
  `).all(req.params.reviewId);
  res.json(comments);
});

router.post("/:bookId/reviews/:reviewId/comments", authMiddleware, (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const result = db.prepare(
    "INSERT INTO review_comments (review_id, user_id, content) VALUES (?, ?, ?)"
  ).run(req.params.reviewId, req.userId, content.trim());

  const comment = db.prepare(`
    SELECT rc.*, u.username
    FROM review_comments rc
    JOIN users u ON u.id = rc.user_id
    WHERE rc.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

router.delete("/:bookId/reviews/:reviewId/comments/:commentId", authMiddleware, (req: AuthRequest, res: Response) => {
  const result = db.prepare("DELETE FROM review_comments WHERE id = ? AND user_id = ?").run(req.params.commentId, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: "Comment not found or not yours" });
    return;
  }
  res.json({ message: "Comment deleted" });
});

// --- Currently Reading ---

router.get("/reading/list", authMiddleware, (req: AuthRequest, res: Response) => {
  const books = db.prepare(`
    SELECT b.*,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
    FROM reading_log rl
    JOIN books b ON b.id = rl.book_id
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE rl.user_id = ? AND rl.end_date IS NULL
    GROUP BY b.id
    ORDER BY rl.created_at DESC
  `).all(req.userId);
  res.json(books);
});

router.get("/:id/reading-status", authMiddleware, (req: AuthRequest, res: Response) => {
  const entry = db.prepare(
    "SELECT id FROM reading_log WHERE user_id = ? AND book_id = ? AND end_date IS NULL"
  ).get(req.userId, req.params.id);
  res.json({ reading: !!entry });
});

router.post("/:id/reading", authMiddleware, (req: AuthRequest, res: Response) => {
  const bookId = Number(req.params.id);
  const book = db.prepare("SELECT id FROM books WHERE id = ?").get(bookId);
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }

  const existing = db.prepare(
    "SELECT id FROM reading_log WHERE user_id = ? AND book_id = ? AND end_date IS NULL"
  ).get(req.userId, bookId) as { id: number } | undefined;

  if (existing) {
    db.prepare("DELETE FROM reading_log WHERE id = ?").run(existing.id);
    res.json({ reading: false });
  } else {
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(
      "INSERT INTO reading_log (user_id, book_id, start_date, format) VALUES (?, ?, ?, ?)"
    ).run(req.userId, bookId, today, "paperback");
    res.json({ reading: true });
  }
});

// --- Similar books ---

router.get("/:id/similar", (req: Request, res: Response) => {
  const book = db.prepare("SELECT genre FROM books WHERE id = ?").get(req.params.id) as { genre: string } | undefined;
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  if (!book.genre) { res.json([]); return; }

  const similar = db.prepare(`
    SELECT b.*,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      (SELECT COUNT(*) FROM read_books WHERE book_id = b.id) as read_count
    FROM books b
    LEFT JOIN reviews r ON r.book_id = b.id
    WHERE b.genre = ? AND b.id != ?
    GROUP BY b.id
    ORDER BY avg_rating DESC, review_count DESC
    LIMIT 8
  `).all(book.genre, req.params.id);

  res.json(similar);
});

export default router;
