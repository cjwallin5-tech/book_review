import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Book } from "../api";
import { getBooks } from "../api";
import { useAuth } from "../context/AuthContext";
import { getReadBooks } from "../api";

export default function TopRatedList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks("rating").then((b) => setBooks(b.slice(0, 100))).catch(console.error);
    if (user) {
      getReadBooks()
        .then((b) => setReadIds(b.map((r) => r.id)))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  return (
    <div>
      <Link to="/lists" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
        &larr; Back to lists
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          &#9733; All Time Best
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          The top 100 highest-rated books &middot; {books.length} books
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {books.map((book, i) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow overflow-hidden"
          >
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">
              {i + 1}
            </div>
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full aspect-[2/3] object-cover"
              loading="lazy"
            />
            {readIds.includes(book.id) && (
              <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Read
              </span>
            )}
            <div className="p-3">
              <p className="text-sm font-medium leading-tight truncate text-gray-900 dark:text-white">{book.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{book.author}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <span>&#9733; {Number(book.avg_rating).toFixed(1)}</span>
                <span className="text-gray-500 dark:text-gray-400">({book.review_count})</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
