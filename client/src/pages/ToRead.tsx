import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Book } from "../api";
import { getTbrBooks, removeTbr } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ToRead() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getTbrBooks().then(setBooks).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  async function handleRemove(bookId: number) {
    try {
      await removeTbr(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch {}
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400">
          <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link> to see your wishlist.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  if (books.length === 0) {
    return (
      <div className="py-24 text-center">
        <svg
          viewBox="0 0 80 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-28 h-auto mx-auto mb-5 opacity-40"
        >
          <rect x="8" y="12" width="14" height="36" rx="2" fill="#34d399" />
          <rect x="25" y="20" width="10" height="28" rx="2" fill="#6ee7b7" />
          <rect x="38" y="8" width="16" height="40" rx="2" fill="#10b981" />
          <rect x="57" y="16" width="12" height="32" rx="2" fill="#34d399" />
          <rect x="4" y="48" width="72" height="3" rx="1.5" fill="#374151" />
          <path d="M18 12 L18 25 L15 22 L12 25 L12 12 Z" fill="#065f46" />
        </svg>
        <p className="text-base font-medium text-gray-200 mb-1">Your wishlist is empty</p>
        <p className="text-sm text-gray-500 mb-5">Save books you want to read and find them here.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-400 transition-colors"
        >
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
          Wishlist
        </span>
        <div className="flex-1 h-px bg-gray-700/60" />
        <span className="text-[11px] text-gray-400">{books.length}</span>
      </div>

      <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7">
        {books.map((book) => (
          <div key={book.id} className="group relative">
            <div className="relative rounded-md overflow-hidden ring-1 ring-white/5 shadow-book transition-all duration-300 group-hover:shadow-book-hover group-hover:-translate-y-1 group-hover:rotate-[0.5deg]">
              <Link to={`/books/${book.id}`}>
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full aspect-[2/3] object-cover block"
                  loading="lazy"
                />
              </Link>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2 pointer-events-none">
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{book.title}</p>
                <p className="text-gray-300 text-[10px] mt-0.5 truncate">{book.author}</p>
              </div>
              <button
                onClick={() => handleRemove(book.id)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
                title="Remove from wishlist"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
