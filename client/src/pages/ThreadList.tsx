import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageSquare, Plus, ArrowLeft } from "lucide-react";
import type { DiscussionCategory, DiscussionThread } from "../api";
import { getCategoryThreads } from "../api";
import { useAuth } from "../context/AuthContext";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avatarColor(name: string): string {
  const palette = [
    "bg-blue-700", "bg-sky-700", "bg-violet-700",
    "bg-rose-700", "bg-amber-700", "bg-teal-700", "bg-indigo-700",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export default function ThreadList() {
  const { id } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState<DiscussionCategory | null>(null);
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCategoryThreads(Number(id))
      .then((data) => {
        setCategory(data.category);
        setThreads(data.threads);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-2 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-lg bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!category) return <p className="text-gray-500 dark:text-gray-400">Category not found.</p>;

  return (
    <div>
      <Link
        to="/discuss"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft size={14} />
        Discussions
      </Link>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{category.description}</p>
          )}
        </div>
        {user && (
          <Link
            to={`/discuss/categories/${category.id}/new`}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-medium"
          >
            <Plus size={14} />
            New Thread
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-1.5">
        {threads.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-3 flex justify-center"><MessageSquare size={36} className="text-gray-600" /></div>
            <p className="text-base font-medium text-gray-300 mb-1">No threads yet</p>
            {user ? (
              <>
                <p className="text-sm text-gray-500 mb-5">Be the first to start the conversation.</p>
                <Link
                  to={`/discuss/categories/${category.id}/new`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Plus size={14} />
                  Start a thread
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link> to start one.
              </p>
            )}
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/discuss/threads/${thread.id}`}
              className="group flex items-center gap-3 p-4 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700/40 hover:border-gray-600 transition-all"
            >
              <div className={`w-8 h-8 rounded-full ${avatarColor(thread.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {thread.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 group-hover:text-white transition-colors truncate">
                  {thread.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {thread.username} · {timeAgo(thread.updated_at || thread.created_at)}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare size={12} />
                <span className="tabular-nums">{thread.post_count}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
