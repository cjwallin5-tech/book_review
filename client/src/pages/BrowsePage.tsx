import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Book } from "../api";
import { getBooks, getReadBooks } from "../api";
import { useAuth } from "../context/AuthContext";

const SORT_LABELS: Record<string, string> = {
  trending: "Popular Right Now",
  rating: "Top Rated",
};

function BookCard({ book, isRead }: { book: Book; isRead: boolean }) {
  return (
    <Link to={`/books/${book.id}`} className="group relative">
      <div className="relative rounded-md overflow-hidden ring-1 ring-white/5 shadow-book transition-all duration-300 group-hover:shadow-book-hover group-hover:-translate-y-1 group-hover:rotate-[0.5deg]">
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
        {isRead && (
          <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            ✓
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
        <p className="mt-1 text-[10px] text-gray-500 leading-tight">
          {book.read_count.toLocaleString()} read
        </p>
      )}
    </Link>
  );
}

export default function BrowsePage() {
  const { sort = "trending" } = useParams<{ sort: string }>();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches: Promise<void>[] = [
      getBooks(sort).then(setBooks).catch(console.error),
    ];
    if (user) {
      fetches.push(
        getReadBooks()
          .then((b) => setReadIds(b.map((r) => r.id)))
          .catch(() => {})
      );
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [sort, user]);

  const label = SORT_LABELS[sort] ?? "Books";

  return (
    <div>
      <Link to="/" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
        ← Back
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-serif font-bold text-white">{label}</h1>
        {!loading && (
          <p className="text-gray-500 text-sm mt-1">{books.length} books</p>
        )}
      </div>

      {loading ? (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="rounded-md overflow-hidden shadow-book ring-1 ring-white/5">
              <div className="w-full aspect-[2/3] skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7">
          {books.map((book) => (
            <BookCard key={book.id} book={book} isRead={readIds.includes(book.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
