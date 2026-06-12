import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { DiscussionThread, DiscussionPost } from "../api";
import { getThread, addPost, deletePost } from "../api";
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function UserAvatar({ username, size = 8 }: { username: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  const textClass = size <= 7 ? "text-xs" : "text-sm";
  return (
    <div className={`${sizeClass} ${avatarColor(username)} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${textClass}`}>
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ThreadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState<DiscussionThread | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    getThread(Number(id))
      .then((data) => {
        setThread(data.thread);
        setPosts(data.posts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const post = await addPost(Number(id), replyText.trim());
      setPosts((prev) => [...prev, post]);
      setReplyText("");
    } catch {}
    setSubmitting(false);
  }

  async function handleDeletePost(postId: number) {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {}
  }

  if (loading) return (
    <div className="space-y-4 mt-6 animate-pulse">
      <div className="h-6 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-1/4" />
      <div className="h-32 bg-gray-800 rounded-xl mt-4" />
    </div>
  );

  if (!thread) return <p className="text-gray-500 dark:text-gray-400">Thread not found.</p>;

  return (
    <div className="max-w-3xl">
      <Link
        to={`/discuss/categories/${thread.category_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft size={14} />
        {thread.category_name || "Back"}
      </Link>

      {/* Thread header */}
      <div className="mt-5 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{thread.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <UserAvatar username={thread.username} size={6} />
          <span className="text-sm font-medium text-blue-400">{thread.username}</span>
          <span className="text-gray-600 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-500">{timeAgo(thread.created_at)}</span>
          <span className="text-gray-600 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-500">{thread.post_count} {thread.post_count === 1 ? "reply" : "replies"}</span>
        </div>
      </div>

      {/* OP body */}
      {thread.body && (
        <div className="mb-6 bg-gray-800 rounded-xl p-5 border border-blue-500/20">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
              Original Post
            </span>
          </div>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        </div>
      )}

      {/* Replies */}
      {posts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Replies
            </span>
            <div className="flex-1 h-px bg-gray-700/60" />
            <span className="text-[11px] text-gray-500">{posts.length}</span>
          </div>
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="flex gap-3">
                <UserAvatar username={post.username} size={8} />
                <div className="flex-1 min-w-0 bg-gray-800 rounded-xl p-4 border border-gray-700/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200">{post.username}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                      {user && user.id === post.user_id && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply form */}
      {user ? (
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Write a Reply
            </span>
            <div className="flex-1 h-px bg-gray-700/60" />
          </div>
          <form onSubmit={handleReply} className="flex gap-3">
            <UserAvatar username={user.username} size={8} />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
                rows={4}
                placeholder="Share your thoughts…"
                className="block w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Posting…" : "Post Reply"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-blue-400 hover:underline font-medium">Sign in</Link> to join the discussion
          </p>
        </div>
      )}
    </div>
  );
}
