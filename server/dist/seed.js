import db from "./db.js";
const TITLES = [
    "To Kill a Mockingbird",
    "1984",
    "The Great Gatsby",
    "Pride and Prejudice",
    "The Catcher in the Rye",
    "Dune",
    "The Hobbit",
    "Fahrenheit 451",
    "Jane Eyre",
    "The Fellowship of the Ring",
    "Brave New World",
    "Animal Farm",
    "Wuthering Heights",
    "The Hitchhiker's Guide to the Galaxy",
    "Slaughterhouse-Five",
    "The Alchemist",
    "The Book Thief",
    "The Kite Runner",
    "A Game of Thrones",
    "The Martian",
    "The Two Towers",
    "The Return of the King",
    "Harry Potter and the Philosopher's Stone",
    "The Da Vinci Code",
    "Gone Girl",
    "The Road",
    "Life of Pi",
    "The Handmaid's Tale",
    "Catch-22",
    "One Hundred Years of Solitude",
    "The Picture of Dorian Gray",
    "Frankenstein",
    "Dracula",
    "The Brothers Karamazov",
    "Crime and Punishment",
    "Moby-Dick",
    "War and Peace",
    "The Iliad",
    "The Odyssey",
    "A Clockwork Orange",
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
const existing = db.prepare("SELECT COUNT(*) as count FROM books").get();
if (existing.count > 0) {
    console.log("Database already has books, skipping seed.");
    process.exit(0);
}
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
    console.log("Fetching book data from Open Library...");
    const books = [];
    for (const t of TITLES) {
        const details = await fetchBookDetails(t);
        if (details) {
            books.push(details);
            console.log(`  Found: ${details.title}`);
        }
        else {
            console.log(`  Skipped: ${t} (not found)`);
        }
        // Small delay to be polite to Open Library
        await new Promise((r) => setTimeout(r, 200));
    }
    if (books.length === 0) {
        console.log("No books found via API. Cannot seed.");
        process.exit(1);
    }
    const insertAll = db.transaction(() => {
        for (const book of books) {
            const result = insertBook.run(book.title, book.author, book.cover_url, book.description, book.genre);
            insertReview.run(result.lastInsertRowid, "Alice", 5, "Absolutely loved this book! A timeless classic.");
            insertReview.run(result.lastInsertRowid, "Bob", 4, "Really great read. Would recommend to anyone.");
            insertReview.run(result.lastInsertRowid, "Charlie", 3, "It was okay, not my favorite genre.");
        }
    });
    insertAll();
    console.log(`Seeded database with ${books.length} books and sample reviews.`);
}
main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
