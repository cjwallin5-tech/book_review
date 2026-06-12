import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { FeedItem } from "../api";
import { getFeed } from "../api";

const HALF_STAR_STYLE: React.CSSProperties = {
  background: "linear-gradient(90deg, #34d399 50%, #6b7280 50%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex leading-none">
      {[1, 2, 3, 4, 5].map((n) =>
        rating >= n ? (
          <span key={n} className="text-blue-400">★</span>
        ) : rating >= n - 0.5 ? (
          <span key={n} style={HALF_STAR_STYLE}>★</span>
        ) : (
          <span key={n} className="text-gray-500 dark:text-gray-600">★</span>
        )
      )}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityFeed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "following">("all");

  useEffect(() => {
    setLoading(true);
    getFeed(tab === "following")
      .then(setFeed)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Activity
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 rounded-md p-1 w-fit">
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
            tab === "all"
              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setTab("following")}
          disabled={!user}
          className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
            tab === "following"
              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          } ${!user ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Following
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">Loading...</p>
      ) : feed.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-16">
          {tab === "following" ? "No activity from people you follow yet." : "No activity yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {feed.map((item) => {
            if (item.type === "review") {
              return (
                <div key={`review-${item.id}`} className="bg-white dark:bg-gray-800 rounded-md shadow-sm dark:shadow-none p-4 flex gap-4">
                  <Link to={`/books/${item.book_id}`} className="shrink-0">
                    <img
                      src={item.cover_url}
                      alt=""
                      className="w-10 rounded object-cover shadow"
                      style={{ aspectRatio: "2/3" }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <Link to={`/users/${item.user_id}`} className="font-semibold text-blue-500 dark:text-blue-400 hover:underline">
                        {item.username}
                      </Link>{" "}
                      <span className="text-gray-400 dark:text-gray-500">reviewed</span>{" "}
                      <Link to={`/books/${item.book_id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
                        {item.title}
                      </Link>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarDisplay rating={item.rating} />
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.date)}</span>
                    </div>
                    {item.content && (
                      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{item.content}</p>
                    )}
                  </div>
                </div>
              );
            }

            if (item.type === "diary") {
              return (
                <div key={`diary-${item.id}`} className="bg-white dark:bg-gray-800 rounded-md shadow-sm dark:shadow-none p-4 flex gap-4">
                  <Link to={`/books/${item.book_id}`} className="shrink-0">
                    <img
                      src={item.cover_url}
                      alt=""
                      className="w-10 rounded object-cover shadow"
                      style={{ aspectRatio: "2/3" }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <Link to={`/users/${item.user_id}`} className="font-semibold text-blue-500 dark:text-blue-400 hover:underline">
                        {item.username}
                      </Link>{" "}
                      <span className="text-gray-400 dark:text-gray-500">logged</span>{" "}
                      <Link to={`/books/${item.book_id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
                        {item.title}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {item.format} · {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              );
            }

            if (item.type === "list") {
              return (
                <div key={`list-${item.id}`} className="bg-white dark:bg-gray-800 rounded-md shadow-sm dark:shadow-none p-4 flex gap-4">
                  <div className="w-10 shrink-0 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center" style={{ aspectRatio: "2/3" }}>
                    <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <Link to={`/users/${item.user_id}`} className="font-semibold text-blue-500 dark:text-blue-400 hover:underline">
                        {item.username}
                      </Link>{" "}
                      <span className="text-gray-400 dark:text-gray-500">created a list</span>{" "}
                      <Link to={`/lists/${item.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400">
                        {item.title}
                      </Link>
                    </p>
                    {item.description && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatDate(item.date)}</p>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
