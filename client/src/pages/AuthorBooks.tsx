import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Book } from "../api";
import { getBooksByAuthor, getReadBooks } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthorBooks() {
  const { name } = useParams();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    getBooksByAuthor(name)
      .then(setBooks)
      .catch(console.error);
    if (user) {
      getReadBooks()
        .then((b) => setReadIds(b.map((r) => r.id)))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [name, user]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to books
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Books by {name}</h1>

      {books.length === 0 ? (
        <p className="text-gray-500">No books found by this author.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="relative bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
            >
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
