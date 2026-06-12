import db from "./db.js";
const ADDITIONAL = [
    "A Moveable Feast",
    "For Whom the Bell Tolls",
    "The Old Man and the Sea",
    "A Farewell to Arms",
    "The Grapes of Wrath",
    "Of Mice and Men",
    "East of Eden",
    "Cannery Row",
    "Adventures of Huckleberry Finn",
    "The Adventures of Tom Sawyer",
    "The Scarlet Letter",
    "The Call of the Wild",
    "White Fang",
    "The Secret Garden",
    "Anne of Green Gables",
    "Little Women",
    "Gone with the Wind",
    "The Count of Monte Cristo",
    "The Three Musketeers",
    "Les Misérables",
    "The Hunchback of Notre-Dame",
    "Don Quixote",
    "Charlotte's Web",
    "Alice's Adventures in Wonderland",
    "The Wonderful Wizard of Oz",
    "Peter Pan",
    "The Wind in the Willows",
    "Winnie-the-Pooh",
    "Watership Down",
    "The Lion, the Witch and the Wardrobe",
    "A Wrinkle in Time",
    "The Giver",
    "Holes",
    "The Hunger Games",
    "Catching Fire",
    "Mockingjay",
    "Twilight",
    "The Shining",
    "Pet Sematary",
    "Carrie",
    "The Stand",
    "Jurassic Park",
    "The Andromeda Strain",
    "Neuromancer",
    "Snow Crash",
    "Ender's Game",
    "Foundation",
    "I, Robot",
    "The Left Hand of Darkness",
    "The Color Purple",
    "Beloved",
    "Invisible Man",
    "Native Son",
    "The Joy Luck Club",
    "Memoirs of a Geisha",
    "The Name of the Rose",
    "The Shadow of the Wind",
    "Rebecca",
    "The Godfather",
    "The Princess Bride",
    "Good Omens",
    "The Time Traveler's Wife",
];
const insertBook = db.prepare("INSERT INTO books (title, author, cover_url, description, genre) VALUES (?, ?, ?, ?, ?)");
const insertReview = db.prepare("INSERT INTO reviews (book_id, user_name, rating, content) VALUES (?, ?, ?, ?)");
const existsStmt = db.prepare("SELECT id FROM books WHERE title = ? AND author = ?");
function titleMatch(searchTitle, resultTitle) {
    const sig = (s) => s.toLowerCase().replace(/-/g, " ").replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "for", "with", "not"].includes(w));
    const sWords = sig(searchTitle);
    if (sWords.length === 0)
        return true;
    const rWords = sig(resultTitle);
    return sWords.every((w) => rWords.includes(w));
}
async function fetchBookDetails(title) {
    try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=10&fields=key,title,author_name,first_sentence,cover_i,subject_facet`;
        const res = await fetch(url);
        const data = await res.json();
        const doc = data.docs.find((d) => d.author_name && d.cover_i && titleMatch(title, d.title));
        if (doc) {
            const d = doc;
            const subjects = d.subject_facet;
            const genre = subjects?.[0] || "";
            return {
                title: d.title,
                author: d.author_name[0],
                cover_url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
                description: d.first_sentence?.[0] || "",
                genre,
            };
        }
    }
    catch { }
    return null;
}
async function main() {
    console.log("Fetching additional books from Open Library...");
    let added = 0;
    for (const t of ADDITIONAL) {
        const details = await fetchBookDetails(t);
        if (!details) {
            console.log(`  Skipped: ${t} (not found)`);
            await new Promise((r) => setTimeout(r, 200));
            continue;
        }
        const existing = existsStmt.get(details.title, details.author);
        if (existing) {
            console.log(`  Exists: ${details.title}`);
        }
        else {
            const result = insertBook.run(details.title, details.author, details.cover_url, details.description, details.genre);
            insertReview.run(result.lastInsertRowid, "Alice", 5, "Absolutely loved this book! A timeless classic.");
            insertReview.run(result.lastInsertRowid, "Bob", 4, "Really great read. Would recommend to anyone.");
            insertReview.run(result.lastInsertRowid, "Charlie", 3, "It was okay, not my favorite genre.");
            added++;
            console.log(`  Added: ${details.title}`);
        }
        await new Promise((r) => setTimeout(r, 200));
    }
    console.log(`\nDone. Added ${added} new books.`);
}
main().catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
});
