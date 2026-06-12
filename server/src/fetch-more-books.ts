/**
 * Fetches ~150 popular English-language books from Open Library and inserts them into the DB.
 * Uses title + author pairs for accurate matching.
 * Fetches real work descriptions (not just first sentences).
 * Safe to re-run: skips books whose titles already exist.
 *
 * Run with: npx tsx src/fetch-more-books.ts
 */

import db from "./db.js";

interface BookEntry {
  title: string;
  author: string;
  genreHint?: string;
}

const BOOKS: BookEntry[] = [
  // --- Modern Literary Fiction ---
  { title: "Normal People", author: "Sally Rooney", genreHint: "Literary Fiction" },
  { title: "Conversations with Friends", author: "Sally Rooney", genreHint: "Literary Fiction" },
  { title: "Beautiful World Where Are You", author: "Sally Rooney", genreHint: "Literary Fiction" },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", genreHint: "Historical Fiction" },
  { title: "Daisy Jones and The Six", author: "Taylor Jenkins Reid", genreHint: "Fiction" },
  { title: "Malibu Rising", author: "Taylor Jenkins Reid", genreHint: "Fiction" },
  { title: "The Midnight Library", author: "Matt Haig", genreHint: "Fiction" },
  { title: "A Man Called Ove", author: "Fredrik Backman", genreHint: "Fiction" },
  { title: "Anxious People", author: "Fredrik Backman", genreHint: "Fiction" },
  { title: "Beartown", author: "Fredrik Backman", genreHint: "Fiction" },
  { title: "A Gentleman in Moscow", author: "Amor Towles", genreHint: "Historical Fiction" },
  { title: "The Lincoln Highway", author: "Amor Towles", genreHint: "Historical Fiction" },
  { title: "Rules of Civility", author: "Amor Towles", genreHint: "Fiction" },
  { title: "Tomorrow and Tomorrow and Tomorrow", author: "Gabrielle Zevin", genreHint: "Literary Fiction" },
  { title: "Lessons in Chemistry", author: "Bonnie Garmus", genreHint: "Fiction" },
  { title: "Where the Crawdads Sing", author: "Delia Owens", genreHint: "Mystery" },
  { title: "The Nightingale", author: "Kristin Hannah", genreHint: "Historical Fiction" },
  { title: "Firefly Lane", author: "Kristin Hannah", genreHint: "Fiction" },
  { title: "Eleanor Oliphant Is Completely Fine", author: "Gail Honeyman", genreHint: "Fiction" },
  { title: "All the Light We Cannot See", author: "Anthony Doerr", genreHint: "Historical Fiction" },
  { title: "The Tattooist of Auschwitz", author: "Heather Morris", genreHint: "Historical Fiction" },
  { title: "Never Let Me Go", author: "Kazuo Ishiguro", genreHint: "Literary Fiction" },
  { title: "The Remains of the Day", author: "Kazuo Ishiguro", genreHint: "Literary Fiction" },
  { title: "The Buried Giant", author: "Kazuo Ishiguro", genreHint: "Fantasy" },
  { title: "White Noise", author: "Don DeLillo", genreHint: "Literary Fiction" },
  { title: "Blood Meridian", author: "Cormac McCarthy", genreHint: "Western" },
  { title: "No Country for Old Men", author: "Cormac McCarthy", genreHint: "Thriller" },
  { title: "Suttree", author: "Cormac McCarthy", genreHint: "Literary Fiction" },
  { title: "Song of Solomon", author: "Toni Morrison", genreHint: "Literary Fiction" },
  { title: "The Bluest Eye", author: "Toni Morrison", genreHint: "Literary Fiction" },
  { title: "Fight Club", author: "Chuck Palahniuk", genreHint: "Literary Fiction" },
  { title: "A Little Life", author: "Hanya Yanagihara", genreHint: "Literary Fiction" },
  { title: "Less", author: "Andrew Sean Greer", genreHint: "Literary Fiction" },
  { title: "Lincoln in the Bardo", author: "George Saunders", genreHint: "Literary Fiction" },
  { title: "The Overstory", author: "Richard Powers", genreHint: "Literary Fiction" },
  { title: "Piranesi", author: "Susanna Clarke", genreHint: "Fantasy" },
  { title: "Jonathan Strange and Mr Norrell", author: "Susanna Clarke", genreHint: "Fantasy" },
  { title: "The Dutch House", author: "Ann Patchett", genreHint: "Fiction" },
  { title: "Bel Canto", author: "Ann Patchett", genreHint: "Fiction" },
  { title: "Commonwealth", author: "Ann Patchett", genreHint: "Fiction" },

  // --- Romance & Contemporary ---
  { title: "It Ends with Us", author: "Colleen Hoover", genreHint: "Romance" },
  { title: "Verity", author: "Colleen Hoover", genreHint: "Thriller" },
  { title: "November 9", author: "Colleen Hoover", genreHint: "Romance" },
  { title: "Ugly Love", author: "Colleen Hoover", genreHint: "Romance" },
  { title: "Reminders of Him", author: "Colleen Hoover", genreHint: "Romance" },
  { title: "Me Before You", author: "Jojo Moyes", genreHint: "Romance" },
  { title: "The Hating Game", author: "Sally Thorne", genreHint: "Romance" },
  { title: "Beach Read", author: "Emily Henry", genreHint: "Romance" },
  { title: "People We Meet on Vacation", author: "Emily Henry", genreHint: "Romance" },
  { title: "Book Lovers", author: "Emily Henry", genreHint: "Romance" },
  { title: "Happy Place", author: "Emily Henry", genreHint: "Romance" },
  { title: "The Notebook", author: "Nicholas Sparks", genreHint: "Romance" },
  { title: "A Walk to Remember", author: "Nicholas Sparks", genreHint: "Romance" },
  { title: "One Day", author: "David Nicholls", genreHint: "Romance" },

  // --- Fantasy ---
  { title: "A Court of Thorns and Roses", author: "Sarah J. Maas", genreHint: "Fantasy" },
  { title: "A Court of Mist and Fury", author: "Sarah J. Maas", genreHint: "Fantasy" },
  { title: "Throne of Glass", author: "Sarah J. Maas", genreHint: "Fantasy" },
  { title: "Fourth Wing", author: "Rebecca Yarros", genreHint: "Fantasy" },
  { title: "Iron Flame", author: "Rebecca Yarros", genreHint: "Fantasy" },
  { title: "Six of Crows", author: "Leigh Bardugo", genreHint: "Fantasy" },
  { title: "Crooked Kingdom", author: "Leigh Bardugo", genreHint: "Fantasy" },
  { title: "Shadow and Bone", author: "Leigh Bardugo", genreHint: "Fantasy" },
  { title: "Ninth House", author: "Leigh Bardugo", genreHint: "Fantasy" },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genreHint: "Fantasy" },
  { title: "The Wise Man's Fear", author: "Patrick Rothfuss", genreHint: "Fantasy" },
  { title: "The Way of Kings", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "Words of Radiance", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "Mistborn", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "The Final Empire", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "The Well of Ascension", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "The Hero of Ages", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "Elantris", author: "Brandon Sanderson", genreHint: "Fantasy" },
  { title: "The Poppy War", author: "R.F. Kuang", genreHint: "Fantasy" },
  { title: "Babel", author: "R.F. Kuang", genreHint: "Fantasy" },
  { title: "Yellowface", author: "R.F. Kuang", genreHint: "Thriller" },
  { title: "The Priory of the Orange Tree", author: "Samantha Shannon", genreHint: "Fantasy" },
  { title: "Red Rising", author: "Pierce Brown", genreHint: "Science Fiction" },
  { title: "Golden Son", author: "Pierce Brown", genreHint: "Science Fiction" },
  { title: "Morning Star", author: "Pierce Brown", genreHint: "Science Fiction" },
  { title: "American Gods", author: "Neil Gaiman", genreHint: "Fantasy" },
  { title: "Stardust", author: "Neil Gaiman", genreHint: "Fantasy" },
  { title: "The Ocean at the End of the Lane", author: "Neil Gaiman", genreHint: "Fantasy" },
  { title: "Coraline", author: "Neil Gaiman", genreHint: "Fantasy" },
  { title: "Neverwhere", author: "Neil Gaiman", genreHint: "Fantasy" },
  { title: "The Magicians", author: "Lev Grossman", genreHint: "Fantasy" },

  // --- Science Fiction ---
  { title: "Project Hail Mary", author: "Andy Weir", genreHint: "Science Fiction" },
  { title: "Flowers for Algernon", author: "Daniel Keyes", genreHint: "Science Fiction" },
  { title: "Hyperion", author: "Dan Simmons", genreHint: "Science Fiction" },
  { title: "The Fall of Hyperion", author: "Dan Simmons", genreHint: "Science Fiction" },
  { title: "Old Man's War", author: "John Scalzi", genreHint: "Science Fiction" },
  { title: "The Dispossessed", author: "Ursula K. Le Guin", genreHint: "Science Fiction" },
  { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin", genreHint: "Fantasy" },
  { title: "Cat's Cradle", author: "Kurt Vonnegut", genreHint: "Science Fiction" },
  { title: "The Sirens of Titan", author: "Kurt Vonnegut", genreHint: "Science Fiction" },
  { title: "Sphere", author: "Michael Crichton", genreHint: "Science Fiction" },
  { title: "Timeline", author: "Michael Crichton", genreHint: "Science Fiction" },
  { title: "Congo", author: "Michael Crichton", genreHint: "Thriller" },
  { title: "Prey", author: "Michael Crichton", genreHint: "Thriller" },
  { title: "Dark Matter", author: "Blake Crouch", genreHint: "Science Fiction" },
  { title: "Recursion", author: "Blake Crouch", genreHint: "Science Fiction" },
  { title: "Upgrade", author: "Blake Crouch", genreHint: "Science Fiction" },
  { title: "The Three-Body Problem", author: "Liu Cixin", genreHint: "Science Fiction" },
  { title: "The Dark Forest", author: "Liu Cixin", genreHint: "Science Fiction" },
  { title: "Oryx and Crake", author: "Margaret Atwood", genreHint: "Science Fiction" },
  { title: "The Blind Assassin", author: "Margaret Atwood", genreHint: "Literary Fiction" },
  { title: "MaddAddam", author: "Margaret Atwood", genreHint: "Science Fiction" },
  { title: "The Long Earth", author: "Terry Pratchett", genreHint: "Science Fiction" },
  { title: "The City and the City", author: "China Mieville", genreHint: "Science Fiction" },
  { title: "Perdido Street Station", author: "China Mieville", genreHint: "Fantasy" },
  { title: "Wool", author: "Hugh Howey", genreHint: "Science Fiction" },
  { title: "Ready Player One", author: "Ernest Cline", genreHint: "Science Fiction" },
  { title: "The Road", author: "Cormac McCarthy", genreHint: "Science Fiction" },

  // --- Mystery & Thriller ---
  { title: "Murder on the Orient Express", author: "Agatha Christie", genreHint: "Mystery" },
  { title: "And Then There Were None", author: "Agatha Christie", genreHint: "Mystery" },
  { title: "The ABC Murders", author: "Agatha Christie", genreHint: "Mystery" },
  { title: "Death on the Nile", author: "Agatha Christie", genreHint: "Mystery" },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genreHint: "Mystery" },
  { title: "The Girl Who Played with Fire", author: "Stieg Larsson", genreHint: "Mystery" },
  { title: "In Cold Blood", author: "Truman Capote", genreHint: "True Crime" },
  { title: "The Big Sleep", author: "Raymond Chandler", genreHint: "Mystery" },
  { title: "The Long Goodbye", author: "Raymond Chandler", genreHint: "Mystery" },
  { title: "The Girl on the Train", author: "Paula Hawkins", genreHint: "Thriller" },
  { title: "The Silent Patient", author: "Alex Michaelides", genreHint: "Thriller" },
  { title: "The Maidens", author: "Alex Michaelides", genreHint: "Thriller" },
  { title: "Big Little Lies", author: "Liane Moriarty", genreHint: "Mystery" },
  { title: "Nine Perfect Strangers", author: "Liane Moriarty", genreHint: "Fiction" },
  { title: "The Woman in the Window", author: "A.J. Finn", genreHint: "Thriller" },
  { title: "Behind Closed Doors", author: "B.A. Paris", genreHint: "Thriller" },
  { title: "The Da Vinci Code", author: "Dan Brown", genreHint: "Thriller" },
  { title: "Angels and Demons", author: "Dan Brown", genreHint: "Thriller" },
  { title: "The Lost Symbol", author: "Dan Brown", genreHint: "Thriller" },
  { title: "Inferno", author: "Dan Brown", genreHint: "Thriller" },
  { title: "The Girl Before", author: "J.P. Delaney", genreHint: "Thriller" },
  { title: "The Thursday Murder Club", author: "Richard Osman", genreHint: "Mystery" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", genreHint: "Science Fiction" },

  // --- Young Adult ---
  { title: "The Fault in Our Stars", author: "John Green", genreHint: "Young Adult" },
  { title: "Looking for Alaska", author: "John Green", genreHint: "Young Adult" },
  { title: "Paper Towns", author: "John Green", genreHint: "Young Adult" },
  { title: "Turtles All the Way Down", author: "John Green", genreHint: "Young Adult" },
  { title: "Divergent", author: "Veronica Roth", genreHint: "Young Adult" },
  { title: "Insurgent", author: "Veronica Roth", genreHint: "Young Adult" },
  { title: "The Maze Runner", author: "James Dashner", genreHint: "Young Adult" },
  { title: "The Perks of Being a Wallflower", author: "Stephen Chbosky", genreHint: "Young Adult" },
  { title: "The House on Mango Street", author: "Sandra Cisneros", genreHint: "Literary Fiction" },
  { title: "The Outsiders", author: "S.E. Hinton", genreHint: "Young Adult" },
  { title: "The Hate U Give", author: "Angie Thomas", genreHint: "Young Adult" },
  { title: "Children of Blood and Bone", author: "Tomi Adeyemi", genreHint: "Fantasy" },
  { title: "An Ember in the Ashes", author: "Sabaa Tahir", genreHint: "Fantasy" },
  { title: "The Cruel Prince", author: "Holly Black", genreHint: "Fantasy" },
  { title: "The Wicked King", author: "Holly Black", genreHint: "Fantasy" },
  { title: "The Invisible Life of Addie LaRue", author: "V.E. Schwab", genreHint: "Fantasy" },
  { title: "A Darker Shade of Magic", author: "V.E. Schwab", genreHint: "Fantasy" },
  { title: "Shades of Magic", author: "V.E. Schwab", genreHint: "Fantasy" },

  // --- Nonfiction & Memoir ---
  { title: "Educated", author: "Tara Westover", genreHint: "Memoir" },
  { title: "Becoming", author: "Michelle Obama", genreHint: "Memoir" },
  { title: "The Glass Castle", author: "Jeannette Walls", genreHint: "Memoir" },
  { title: "Wild", author: "Cheryl Strayed", genreHint: "Memoir" },
  { title: "Born a Crime", author: "Trevor Noah", genreHint: "Memoir" },
  { title: "Between the World and Me", author: "Ta-Nehisi Coates", genreHint: "Non-Fiction" },
  { title: "Just Kids", author: "Patti Smith", genreHint: "Memoir" },
  { title: "Into the Wild", author: "Jon Krakauer", genreHint: "Non-Fiction" },
  { title: "Into Thin Air", author: "Jon Krakauer", genreHint: "Non-Fiction" },
  { title: "Sapiens", author: "Yuval Noah Harari", genreHint: "Non-Fiction" },
  { title: "Homo Deus", author: "Yuval Noah Harari", genreHint: "Non-Fiction" },
  { title: "Thinking Fast and Slow", author: "Daniel Kahneman", genreHint: "Non-Fiction" },
  { title: "Atomic Habits", author: "James Clear", genreHint: "Self-Help" },
  { title: "The Power of Habit", author: "Charles Duhigg", genreHint: "Self-Help" },
  { title: "A Brief History of Time", author: "Stephen Hawking", genreHint: "Non-Fiction" },
  { title: "The Selfish Gene", author: "Richard Dawkins", genreHint: "Non-Fiction" },
  { title: "Guns Germs and Steel", author: "Jared Diamond", genreHint: "Non-Fiction" },
  { title: "The Body Keeps the Score", author: "Bessel van der Kolk", genreHint: "Non-Fiction" },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", genreHint: "Non-Fiction" },
  { title: "Night", author: "Elie Wiesel", genreHint: "Memoir" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", genreHint: "Memoir" },
  { title: "When Breath Becomes Air", author: "Paul Kalanithi", genreHint: "Memoir" },
  { title: "The Year of Magical Thinking", author: "Joan Didion", genreHint: "Memoir" },
  { title: "H is for Hawk", author: "Helen Macdonald", genreHint: "Memoir" },
  { title: "The Emperor of All Maladies", author: "Siddhartha Mukherjee", genreHint: "Non-Fiction" },
  { title: "Being Mortal", author: "Atul Gawande", genreHint: "Non-Fiction" },
  { title: "Bad Blood", author: "John Carreyrou", genreHint: "Non-Fiction" },
  { title: "Hillbilly Elegy", author: "J.D. Vance", genreHint: "Memoir" },
];

// ---- DB helpers ----

const insertBook = db.prepare(
  "INSERT INTO books (title, author, cover_url, description, genre) VALUES (?, ?, ?, ?, ?)"
);

const existsByTitle = db.prepare(
  "SELECT id FROM books WHERE lower(title) = lower(?)"
);

// ---- Utilities ----

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ShelfApp/1.0 (book-catalog-import; contact@shelf.app)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Extract a readable description from a work's description field. */
function extractDescription(raw: unknown): string {
  if (!raw) return "";
  const text = typeof raw === "string" ? raw : (raw as any).value ?? "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip markdown links
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

/** Map Open Library subjects to a clean genre label. */
function subjectsToGenre(subjects: string[]): string {
  const lower = subjects.map((s) => s.toLowerCase());
  const checks: [string, string[]][] = [
    ["Science Fiction", ["science fiction", "sci-fi", "space opera", "dystopia", "cyberpunk"]],
    ["Fantasy", ["fantasy", "magic", "wizards", "dragons", "sword and sorcery"]],
    ["Mystery", ["mystery", "detective fiction", "detective stories", "whodunit"]],
    ["Thriller", ["thriller", "suspense", "espionage"]],
    ["Horror", ["horror"]],
    ["Romance", ["romance", "love stories"]],
    ["Historical Fiction", ["historical fiction"]],
    ["Young Adult", ["young adult", "juvenile fiction", "teen fiction"]],
    ["Memoir", ["autobiography", "memoir", "personal memoirs"]],
    ["Biography", ["biography"]],
    ["Self-Help", ["self-help", "personal development"]],
    ["Non-Fiction", ["nonfiction", "non-fiction", "essays"]],
    ["Literary Fiction", ["literary fiction"]],
  ];
  for (const [label, keywords] of checks) {
    if (lower.some((s) => keywords.some((k) => s.includes(k)))) return label;
  }
  return subjects[0] ?? "";
}

// ---- Core fetch logic ----

async function fetchWorkDescription(workKey: string): Promise<string> {
  try {
    await sleep(150);
    const work = await fetchJson(`https://openlibrary.org${workKey}.json`);
    return extractDescription(work.description);
  } catch {
    return "";
  }
}

interface OLSearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  subject_facet?: string[];
  language?: string[];
}

async function searchOpenLibrary(title: string, author: string): Promise<OLSearchDoc | null> {
  const url =
    `https://openlibrary.org/search.json?` +
    `title=${encodeURIComponent(title)}&` +
    `author=${encodeURIComponent(author)}&` +
    `limit=5&` +
    `fields=key,title,author_name,cover_i,subject_facet,language`;

  const data = await fetchJson(url);
  const docs: OLSearchDoc[] = data.docs ?? [];

  // Prefer docs that have a cover image; author name is a bonus check
  const authorLower = author.toLowerCase();
  const match =
    docs.find(
      (d) =>
        d.cover_i &&
        d.author_name?.some((a) => a.toLowerCase().includes(authorLower.split(" ").pop()!))
    ) ??
    docs.find((d) => d.cover_i) ??
    docs[0] ??
    null;

  return match;
}

// ---- Main ----

async function processBook(entry: BookEntry): Promise<"added" | "exists" | "skipped"> {
  // Case-insensitive duplicate check
  if (existsByTitle.get(entry.title)) return "exists";

  const doc = await searchOpenLibrary(entry.title, entry.author);
  if (!doc || !doc.cover_i) return "skipped";

  const description = await fetchWorkDescription(doc.key);

  const genre =
    entry.genreHint ??
    subjectsToGenre(doc.subject_facet ?? []);

  const authorName = doc.author_name?.[0] ?? entry.author;
  const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;

  insertBook.run(doc.title, authorName, coverUrl, description, genre);
  return "added";
}

async function main() {
  const total = BOOKS.length;
  console.log(`\nFetching up to ${total} books from Open Library...\n`);

  let added = 0;
  let exists = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < BOOKS.length; i++) {
    const entry = BOOKS[i];
    const prefix = `[${String(i + 1).padStart(3)}/${total}]`;
    process.stdout.write(`${prefix} ${entry.title}... `);

    try {
      const result = await processBook(entry);
      if (result === "added") {
        console.log("✓ added");
        added++;
      } else if (result === "exists") {
        console.log("– already in DB");
        exists++;
      } else {
        console.log("✗ not found / no cover");
        skipped++;
      }
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      errors++;
    }

    // Respect Open Library rate limits (~2 req/s recommended)
    await sleep(550);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✓ Added:    ${added}`);
  console.log(`– Exists:   ${exists}`);
  console.log(`✗ Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`─────────────────────────────────`);
  console.log(`Total in DB now: ${(db.prepare("SELECT COUNT(*) as n FROM books").get() as any).n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
