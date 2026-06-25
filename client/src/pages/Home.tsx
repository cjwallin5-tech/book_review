import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import type { Book, ReadingProgress } from "../api";
import { getBooks, getReadBooks, getCurrentlyReadingBooks, getFriendsReading, getAllReadingProgress, getSurpriseBook } from "../api";
import { useAuth } from "../context/AuthContext";

const ROW_SIZE = 14;

const FICTION_GENRES = new Set([
  "Fiction", "Science Fiction", "Fantasy", "Romance", "Mystery", "Thriller",
  "Historical Fiction", "Adventure", "Crime", "Young Adult", "Children", "Drama", "Horror",
]);
const NONFICTION_GENRES = new Set([
  "Non-Fiction", "History", "Biography", "Memoir", "Self-Help",
  "Philosophy", "Psychology", "Poetry", "Graphic Novel",
]);

function BookCard({ book, index, isRead }: { book: Book; index: number; isRead: boolean }) {
  return (
    <Link
      to={`/books/${book.id}`}
      className="group relative shrink-0 w-24 sm:w-28 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 28, 360)}ms` }}
    >
      <div className="relative rounded-md overflow-hidden ring-1 ring-white/5 shadow-book transition-all duration-300 group-hover:shadow-book-hover group-hover:-translate-y-1 group-hover:rotate-[0.5deg]">
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
        {isRead && (
          <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
          <p className="text-white text-xs font-medium leading-tight line-clamp-2">{book.title}</p>
          <p className="text-gray-300 text-[10px] mt-0.5 truncate">{book.author}</p>
          {book.review_count > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              <span className="text-blue-400 text-[10px]">★</span>
              <span className="text-white text-[10px] font-medium">
                {Number(book.avg_rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
      {book.read_count > 0 && (
        <p className="mt-1 text-[10px] text-gray-500 leading-tight truncate">
          {book.read_count.toLocaleString()} read
        </p>
      )}
    </Link>
  );
}

function BookRow({
  title,
  books,
  readIds,
  loading,
  browsePath,
}: {
  title: string;
  books: Book[];
  readIds: number[];
  loading: boolean;
  browsePath?: string;
}) {
  const visible = books.slice(0, ROW_SIZE);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        {browsePath ? (
          <Link
            to={browsePath}
            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
          >
            {title}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-white">{title}</span>
        )}
        <div className="flex-1 h-px bg-gray-700/60" />
        {!loading && browsePath && (
          <Link
            to={browsePath}
            className="text-[10px] font-medium text-gray-500 hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            See all →
          </Link>
        )}
      </div>
      {loading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-24 sm:w-28 rounded-md overflow-hidden shadow-book ring-1 ring-white/5">
              <div className="w-full aspect-[2/3] skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {visible.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} isRead={readIds.includes(book.id)} />
          ))}
          {browsePath && books.length > ROW_SIZE && (
            <Link
              to={browsePath}
              className="shrink-0 w-24 sm:w-28 flex items-center justify-center rounded-md ring-1 ring-white/10 bg-gray-800/60 hover:bg-gray-700/60 transition-colors aspect-[2/3]"
            >
              <div className="text-center px-2">
                <p className="text-gray-300 text-xs font-medium">See all</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{books.length} books</p>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const META_GENRE_DESCRIPTIONS: Record<string, string> = {
  Fiction: "Fantasy, Sci-Fi, Mystery, Romance, Thriller + more",
  "Non-Fiction": "History, Biography, Memoir, Self-Help + more",
};

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
      {children}
    </div>
  );
}

function GenreFilterRow({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5 flex-wrap">
        {items.map((item) => {
          const isMeta = item === "Fiction" || item === "Non-Fiction";
          const isActive = selected === item;
          return (
            <div key={item} className="relative group">
              <button
                onClick={() => onSelect(item)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : isMeta
                    ? "ring-1 ring-blue-400/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {item}
              </button>
              {isMeta && !isActive && META_GENRE_DESCRIPTIONS[item] && (
                <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 border border-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    {META_GENRE_DESCRIPTIONS[item]}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {(selected === "Fiction" || selected === "Non-Fiction") && (
        <p className="text-[11px] text-blue-400/80 italic">
          Showing all {selected.toLowerCase()} sub-genres
        </p>
      )}
    </div>
  );
}

function PillFilterRow({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === item
              ? "bg-blue-500 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [topRatedBooks, setTopRatedBooks] = useState<Book[]>([]);
  const [friendsBooks, setFriendsBooks] = useState<Book[]>([]);
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Map<number, ReadingProgress>>(new Map());
  const [surprising, setSurprising] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const promises: Promise<void>[] = [
      getBooks().then(setAllBooks).catch(console.error),
      getBooks("trending").then(setTrendingBooks).catch(console.error),
      getBooks("rating").then(setTopRatedBooks).catch(console.error),
    ];
    if (user) {
      promises.push(getFriendsReading().then(setFriendsBooks).catch(() => {}));
      promises.push(
        getReadBooks()
          .then((b) => setReadIds(b.map((r) => r.id)))
          .catch(() => {})
      );
      promises.push(getCurrentlyReadingBooks().then(setCurrentlyReading).catch(() => {}));
      promises.push(
        getAllReadingProgress()
          .then((prog) => setProgressMap(new Map(prog.map((p) => [p.book_id, p]))))
          .catch(() => {})
      );
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [user]);

  const specificGenres = Array.from(new Set(allBooks.map((b) => b.genre).filter(Boolean))).sort();
  const hasFiction = specificGenres.some((g) => FICTION_GENRES.has(g));
  const hasNonFiction = specificGenres.some((g) => NONFICTION_GENRES.has(g));
  const genres = [
    "All",
    ...(hasFiction ? ["Fiction"] : []),
    ...(hasNonFiction ? ["Non-Fiction"] : []),
    ...specificGenres.filter((g) => g !== "Fiction" && g !== "Non-Fiction"),
  ];
  const countries = ["All", ...Array.from(new Set(allBooks.map((b) => b.country).filter(Boolean))).sort()];

  const filtersActive = selectedGenre !== "All" || selectedCountry !== "All" || minRating > 0;
  const activeFilterCount =
    (selectedGenre !== "All" ? 1 : 0) +
    (selectedCountry !== "All" ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const filteredBooks = allBooks.filter((book) => {
    if (selectedGenre !== "All") {
      const g = book.genre || "";
      if (selectedGenre === "Fiction" && !FICTION_GENRES.has(g)) return false;
      else if (selectedGenre === "Non-Fiction" && !NONFICTION_GENRES.has(g)) return false;
      else if (selectedGenre !== "Fiction" && selectedGenre !== "Non-Fiction" && g !== selectedGenre) return false;
    }
    if (selectedCountry !== "All" && book.country !== selectedCountry) return false;
    if (minRating > 0 && book.avg_rating < minRating) return false;
    return true;
  });

  const RATINGS = [
    { label: "Any", value: 0 },
    { label: "3★+", value: 3 },
    { label: "4★+", value: 4 },
  ];

  function clearFilters() {
    setSelectedGenre("All");
    setSelectedCountry("All");
    setMinRating(0);
  }

  async function handleSurprise() {
    if (surprising) return;
    setSurprising(true);
    try {
      const book = await getSurpriseBook();
      navigate(`/books/${book.id}`);
    } catch {}
    setSurprising(false);
  }

  return (
    <div>
      {/* ── Hero (logged-out) ──────────────────────────────────────────────── */}
      {!user && (
        <div className="relative mb-12 rounded-2xl overflow-hidden min-h-[360px] flex items-center">
          {allBooks.length > 0 && (
            <div className="absolute inset-0 flex">
              {allBooks.slice(0, 14).map((book) => (
                <div key={book.id} className="flex-1 overflow-hidden">
                  <img
                    src={book.cover_url}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="absolute inset-0 bg-gray-950/72 backdrop-blur-[3px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
          <div className="relative w-full px-8 py-20 text-center animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400 mb-4">
              Your reading life, beautifully tracked
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
              Track the books<br className="hidden sm:block" /> that shape you.
            </h1>
            <p className="text-lg text-gray-300 mb-10 max-w-md mx-auto leading-relaxed">
              Log what you've read, discover what's next, and share with friends who love books.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/register"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-400 transition-colors"
              >
                Get started — it's free
              </Link>
              <Link
                to="/login"
                className="border border-white/20 bg-white/5 backdrop-blur-sm text-gray-200 px-8 py-3 rounded-lg font-semibold text-lg hover:border-white/40 hover:text-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Currently Reading ─────────────────────────────────────────────── */}
      {user && !loading && currentlyReading.length > 0 && (
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
              Currently Reading
            </span>
            <div className="flex-1 h-px bg-gray-700/60" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {currentlyReading.map((book) => {
              const prog = progressMap.get(book.id);
              const pct = prog?.total_pages ? Math.min(100, (prog.current_page / prog.total_pages) * 100) : 0;
              return (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="group shrink-0 w-20 relative"
                  title={book.title}
                >
                  <div className="relative rounded-md overflow-hidden ring-1 ring-white/5 shadow-book transition-all duration-300 group-hover:shadow-book-hover group-hover:-translate-y-1">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full aspect-[2/3] object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${pct || 4}%` }} />
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400 leading-tight line-clamp-1">{book.title}</p>
                  {prog?.total_pages ? (
                    <p className="text-[10px] text-gray-600 leading-none">p. {prog.current_page}/{prog.total_pages}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showFilters || filtersActive
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-gray-800/80 text-gray-400 border-transparent hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                className={`shrink-0 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              onClick={handleSurprise}
              disabled={surprising}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
            >
              {surprising ? "..." : "Surprise me"}
            </button>

            {filtersActive && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-3 p-5 bg-gray-900/70 border border-gray-700/50 rounded-xl space-y-5 animate-fade-in shadow-lg">
              {genres.length > 2 && (
                <FilterSection label="Genre">
                  <GenreFilterRow
                    items={genres}
                    selected={selectedGenre}
                    onSelect={setSelectedGenre}
                  />
                </FilterSection>
              )}
              {countries.length > 2 && (
                <FilterSection label="Country">
                  <PillFilterRow
                    items={countries}
                    selected={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                </FilterSection>
              )}
              <FilterSection label="Min Rating">
                <PillFilterRow
                  items={RATINGS.map((r) => r.label)}
                  selected={RATINGS.find((r) => r.value === minRating)?.label ?? "Any"}
                  onSelect={(label) => setMinRating(RATINGS.find((r) => r.label === label)?.value ?? 0)}
                />
              </FilterSection>
            </div>
          )}
        </div>
      )}

      {/* ── Filtered results view ─────────────────────────────────────────── */}
      {filtersActive && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-white">Filtered Results</span>
            <span className="text-xs text-gray-500">{filteredBooks.length} books</span>
            <div className="flex-1 h-px bg-gray-700/60" />
          </div>
          {filteredBooks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm mb-2">No books match these filters.</p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7">
              {filteredBooks.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} isRead={readIds.includes(book.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Book rows ─────────────────────────────────────────────────────── */}
      {!filtersActive && (
        <>
          <BookRow
            title="Popular Right Now"
            books={trendingBooks}
            readIds={readIds}
            loading={loading}
            browsePath="/browse/trending"
          />

          {user && friendsBooks.length > 0 && (
            <BookRow
              title="Friends Are Reading"
              books={friendsBooks}
              readIds={readIds}
              loading={false}
            />
          )}

          <BookRow
            title="Top Rated"
            books={topRatedBooks}
            readIds={readIds}
            loading={loading}
            browsePath="/browse/rating"
          />
        </>
      )}
    </div>
  );
}
