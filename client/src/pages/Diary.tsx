import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DiaryEntry } from "../api";
import { getDiaryEntries, removeDiaryEntry } from "../api";
import { useAuth } from "../context/AuthContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function entryDate(e: DiaryEntry) {
  return e.end_date || e.start_date;
}

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDiaryEntries().then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  async function handleRemove(id: number) {
    try {
      await removeDiaryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {}
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link> to see your reading diary.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>;

  if (entries.length === 0) {
    return (
      <div className="py-24 text-center">
        <svg
          viewBox="0 0 80 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-28 h-auto mx-auto mb-5 opacity-40"
        >
          <path d="M8 10 Q8 8 10 8 L38 8 L38 56 L10 56 Q8 56 8 54 Z" fill="#1f2937" stroke="#374151" strokeWidth="1.5"/>
          <path d="M42 8 L70 8 Q72 8 72 10 L72 54 Q72 56 70 56 L42 56 Z" fill="#1f2937" stroke="#374151" strokeWidth="1.5"/>
          <rect x="37" y="8" width="6" height="48" rx="1" fill="#374151"/>
          <line x1="14" y1="22" x2="34" y2="22" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="28" x2="34" y2="28" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="34" x2="28" y2="34" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="46" y1="22" x2="66" y2="22" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="46" y1="28" x2="60" y2="28" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="46" y1="34" x2="64" y2="34" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-base font-medium text-gray-200 mb-1">Your diary is empty</p>
        <p className="text-sm text-gray-500 mb-5">Log what you've read to build your reading history.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-400 transition-colors"
        >
          Find a book to log
        </Link>
      </div>
    );
  }

  // Group by month
  const grouped: Record<string, DiaryEntry[]> = {};
  for (const e of entries) {
    const key = monthKey(entryDate(e));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Reading Diary
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{entries.length}</span>
      </div>

      {Object.entries(grouped).map(([key, group]) => (
        <div key={key} className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
            {monthLabel(entryDate(group[0]))}
          </p>

          <div className="space-y-1">
            {group.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 group/entry">
                <Link to={`/books/${entry.book_id}`} className="shrink-0">
                  <img
                    src={entry.cover_url}
                    alt={entry.title}
                    className="w-9 rounded object-cover shadow-sm"
                    style={{ aspectRatio: "2/3" }}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/books/${entry.book_id}`}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    {entry.title}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                    <Link
                      to={`/author/${encodeURIComponent(entry.author)}`}
                      className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      {entry.author}
                    </Link>
                    <span>·</span>
                    {entry.end_date ? (
                      <span>
                        {formatDate(entry.start_date)} → {formatDate(entry.end_date)}
                      </span>
                    ) : (
                      <span>Started {formatDate(entry.start_date)}</span>
                    )}
                    <span>·</span>
                    <span className="capitalize">{entry.format}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(entry.id)}
                  className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors opacity-0 group-hover/entry:opacity-100 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
