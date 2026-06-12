import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import type { SearchResults, OpenLibraryBook } from "../api";
import { search, searchOpenLibrary, addBook } from "../api";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

function OLResultCard({
  book,
  onAdd,
  addedId,
  adding,
}: {
  book: OpenLibraryBook;
  onAdd: () => void;
  addedId: number | null;
  adding: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 p-3 flex gap-3">
      <div className="shrink-0">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-14 aspect-[2/3] object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "";
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-14 aspect-[2/3] rounded bg-gray-700 flex items-center justify-center text-gray-500 text-xs text-center px-1">
            No cover
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-medium text-sm leading-tight text-gray-100 line-clamp-2">{book.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author}</p>
          {book.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{book.description}</p>
          )}
        </div>

        <div className="mt-2">
          {addedId ? (
            <Link
              to={`/books/${addedId}`}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={11} />
              View on Overdue
            </Link>
          ) : (
            <button
              onClick={onAdd}
              disabled={adding}
              className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {adding ? (
                <><Loader2 size={11} className="animate-spin" /> Adding…</>
              ) : (
                <><Download size={11} /> Add to Overdue</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState(initialType);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const [olResults, setOlResults] = useState<OpenLibraryBook[]>([]);
  const [olLoading, setOlLoading] = useState(false);
  const [olSearched, setOlSearched] = useState(false);
  const [olError, setOlError] = useState("");
  // olid → new book id (after adding)
  const [addedBooks, setAddedBooks] = useState<Record<string, number>>({});
  // olid currently being added
  const [addingBook, setAddingBook] = useState<string | null>(null);

  const tabs = [
    { value: "", label: "All" },
    { value: "books", label: "Books" },
    { value: "authors", label: "Authors" },
    { value: "lists", label: "Lists" },
  ];

  // Reset OL state when query changes
  useEffect(() => {
    setOlResults([]);
    setOlSearched(false);
    setOlError("");
  }, [query]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    setLoading(true);
    search(query.trim(), type || undefined)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, type]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams({ q: query, ...(type ? { type } : {}) });
  }

  function switchTab(tab: string) {
    setType(tab);
    setSearchParams({ q: query, ...(tab ? { type: tab } : {}) });
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    setSearchParams({});
    setOlResults([]);
    setOlSearched(false);
    inputRef.current?.focus();
  }

  async function handleOLSearch() {
    if (!query.trim()) return;
    setOlLoading(true);
    setOlError("");
    setOlSearched(true);
    try {
      const res = await searchOpenLibrary(query.trim());
      setOlResults(res);
    } catch {
      setOlError("Failed to reach Open Library. Try again.");
    } finally {
      setOlLoading(false);
    }
  }

  async function handleAddBook(book: OpenLibraryBook) {
    if (addingBook) return;
    setAddingBook(book.olid);
    try {
      const added = await addBook({
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        description: book.description,
      });
      setAddedBooks((prev) => ({ ...prev, [book.olid]: added.id }));
    } catch {
      // silently fail — user can retry
    } finally {
      setAddingBook(null);
    }
  }

  const books = results?.books || [];
  const authors = results?.authors || [];
  const lists = results?.lists || [];
  const hasResults = books.length > 0 || authors.length > 0 || lists.length > 0;
  const showOLSection = !loading && query.trim().length > 0;

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, authors, lists..."
          className="flex-1 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Clear
          </button>
        )}
      </form>

      {query.trim() && (
        <div className="mt-4 flex gap-1 border-b dark:border-gray-700">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => switchTab(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                type === t.value
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="mt-6 text-gray-500 dark:text-gray-400 text-sm">Searching...</p>}

      {!loading && query.trim() && !hasResults && (
        <div className="mt-14 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-base font-medium text-gray-300 mb-1">No results for "{query}"</p>
          <p className="text-sm text-gray-500">Try a different title, author name, or genre.</p>
        </div>
      )}

      {!loading && !query.trim() && (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search for books, authors, or reading lists.
          </p>
        </div>
      )}

      {!loading && !type && hasResults && (
        <div className="mt-6 space-y-8">
          {books.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Books</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((b) => (
                  <Link
                    key={b.id}
                    to={`/books/${b.id}`}
                    className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3 flex gap-3 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow"
                  >
                    <img src={b.cover_url} alt={b.title} className="w-14 aspect-[2/3] object-cover rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm leading-tight truncate text-gray-900 dark:text-white">{b.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{b.author}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <StarDisplay rating={b.avg_rating} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">({b.review_count})</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {books.length >= 20 && (
                <button onClick={() => switchTab("books")} className="mt-2 text-sm text-blue-500 hover:underline">
                  See all books &rarr;
                </button>
              )}
            </section>
          )}

          {authors.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Authors</h2>
              <div className="space-y-2">
                {authors.map((a) => (
                  <Link
                    key={a.author}
                    to={`/author/${encodeURIComponent(a.author)}`}
                    className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{a.author}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {a.book_count} {a.book_count === 1 ? "book" : "books"}
                      {a.avg_rating > 0 && (<> &middot; <StarDisplay rating={a.avg_rating} /></>)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {lists.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Lists</h2>
              <div className="space-y-2">
                {lists.map((l) => (
                  <Link
                    key={l.id}
                    to={`/lists/${l.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{l.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      by {l.username} &middot; {l.item_count} {l.item_count === 1 ? "book" : "books"}
                      &middot; {l.like_count} {l.like_count === 1 ? "like" : "likes"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!loading && type === "books" && books.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <Link
              key={b.id}
              to={`/books/${b.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3 flex gap-3 hover:shadow-md transition-shadow"
            >
              <img src={b.cover_url} alt={b.title} className="w-14 aspect-[2/3] object-cover rounded" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm leading-tight truncate dark:text-white">{b.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.author}</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarDisplay rating={b.avg_rating} />
                  <span className="text-xs text-gray-400">({b.review_count})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && type === "authors" && authors.length > 0 && (
        <div className="mt-6 space-y-2">
          {authors.map((a) => (
            <Link
              key={a.author}
              to={`/author/${encodeURIComponent(a.author)}`}
              className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <p className="font-medium dark:text-white">{a.author}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {a.book_count} {a.book_count === 1 ? "book" : "books"}
                {a.avg_rating > 0 && (<> &middot; <StarDisplay rating={a.avg_rating} /></>)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {!loading && type === "lists" && lists.length > 0 && (
        <div className="mt-6 space-y-2">
          {lists.map((l) => (
            <Link
              key={l.id}
              to={`/lists/${l.id}`}
              className="block bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <p className="font-medium dark:text-white">{l.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                by {l.username} &middot; {l.item_count} {l.item_count === 1 ? "book" : "books"}
                &middot; {l.like_count} {l.like_count === 1 ? "like" : "likes"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Open Library import ─────────────────────────────────────────────── */}
      {showOLSection && (
        <div className="mt-10 border-t border-gray-800 pt-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Import from Open Library
            </span>
            <div className="flex-1 h-px bg-gray-700/60" />
          </div>

          {!olSearched ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">Don't see the book you're looking for?</p>
              <button
                onClick={handleOLSearch}
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors"
              >
                <Download size={13} />
                Search Open Library for "{query}"
              </button>
            </div>
          ) : olLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" />
              Searching Open Library…
            </div>
          ) : olError ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-400">{olError}</p>
              <button onClick={handleOLSearch} className="text-xs text-gray-400 hover:text-gray-200 underline">
                Retry
              </button>
            </div>
          ) : olResults.length === 0 ? (
            <p className="text-sm text-gray-500">No results found on Open Library for "{query}".</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-4">
                {olResults.length} results from Open Library — click "Add to Overdue" to import a book.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {olResults.map((book) => (
                  <OLResultCard
                    key={book.olid}
                    book={book}
                    onAdd={() => handleAddBook(book)}
                    addedId={addedBooks[book.olid] ?? null}
                    adding={addingBook === book.olid}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
