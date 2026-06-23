import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Lock, List } from "lucide-react";
import type { BookList } from "../api";
import { getLists } from "../api";

export default function Lists() {
  const [lists, setLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLists().then(setLists).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Lists
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        <Link
          to="/lists/new"
          className="flex items-center gap-1 text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <Plus size={13} />
          New list
        </Link>
      </div>

      {/* Featured */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Featured</p>
        <Link
          to="/lists/top-rated"
          className="group flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            ★
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              All Time Best
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The 100 highest-rated books on Overdue</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">100 books</span>
        </Link>
      </div>

      {/* Popular lists */}
      {lists.filter((l) => l.like_count > 0).length > 0 && (
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Popular</p>
          <div className="space-y-px">
            {[...lists]
              .filter((l) => l.like_count > 0)
              .sort((a, b) => b.like_count - a.like_count)
              .slice(0, 5)
              .map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="group flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    {list.cover_url ? (
                      <img src={list.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors truncate">
                      {list.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">by {list.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{list.item_count} books</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">♥ {list.like_count}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* User lists */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">All Lists</p>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          {lists.length > 0 && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{lists.length}</span>
          )}
        </div>

        {lists.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 flex justify-center"><List size={36} className="text-gray-600" /></div>
            <p className="text-sm font-medium text-gray-300 mb-1">No lists yet</p>
            <p className="text-xs text-gray-500 mb-4">Create a list to share your favorites.</p>
            <Link
              to="/lists/new"
              className="inline-flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors"
            >
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="space-y-px">
            {lists.map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="group flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
              >
                {/* Cover mosaic / placeholder */}
                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {list.cover_url ? (
                    <img src={list.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors truncate">
                      {list.title}
                    </p>
                    {list.is_private && (
                      <Lock size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
                    )}
                  </div>
                  {list.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{list.description}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">by {list.username}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{list.item_count} {list.item_count === 1 ? "book" : "books"}</p>
                  {list.like_count > 0 && (
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{list.like_count} likes</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
