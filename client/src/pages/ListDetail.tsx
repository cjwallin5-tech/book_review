import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Lock } from "lucide-react";
import type { BookListDetail, ListComment } from "../api";
import { getList, deleteList, likeList, unlikeList, getListComments, addListComment, deleteListComment } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ListDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<BookListDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getList(Number(id)).then(setList).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!list || !confirm("Delete this list?")) return;
    try {
      await deleteList(list.id);
      navigate("/lists");
    } catch {}
  }

  async function handleLike() {
    if (!list || !user) { navigate("/login"); return; }
    try {
      if (list.is_liked) {
        await unlikeList(list.id);
        setList({ ...list, is_liked: false, like_count: list.like_count - 1 });
      } else {
        await likeList(list.id);
        setList({ ...list, is_liked: true, like_count: list.like_count + 1 });
      }
    } catch {}
  }

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>;
  if (!list) return <p className="text-sm text-gray-400 dark:text-gray-500">List not found.</p>;

  const isOwner = user && user.id === list.user_id;

  return (
    <div>
      <Link to="/lists" className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
        ← Lists
      </Link>

      {/* Header */}
      <div className="mt-5 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              {list.title}
              {list.is_private && <Lock size={15} className="text-gray-400 shrink-0" />}
            </h1>
            {list.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{list.description}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              by{" "}
              <Link to={`/users/${list.user_id}`} className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                {list.username}
              </Link>
              {" "}· {list.item_count} {list.item_count === 1 ? "book" : "books"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                list.is_liked
                  ? "text-red-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-red-400"
              }`}
            >
              <Heart size={14} fill={list.is_liked ? "currentColor" : "none"} />
              {list.like_count > 0 && <span>{list.like_count}</span>}
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Book grid */}
      {list.items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">This list is empty.</p>
      ) : (
        <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 mb-12">
          {list.items.map((item) => (
            <Link
              key={item.id}
              to={`/books/${item.book_id}`}
              className="group relative rounded-md overflow-hidden bg-gray-800 shadow-md"
              title={item.title}
            >
              <img
                src={item.cover_url}
                alt={item.title}
                className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{item.title}</p>
                <p className="text-gray-300 text-[10px] mt-0.5 truncate">{item.author}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CommentSection listId={list.id} currentUser={user} />
    </div>
  );
}

function CommentSection({ listId, currentUser }: { listId: number; currentUser: any }) {
  const [comments, setComments] = useState<ListComment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    getListComments(listId).then(setComments).catch(console.error);
  }, [listId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !text.trim()) return;
    try {
      const c = await addListComment(listId, text.trim());
      setComments((prev) => [...prev, c]);
      setText("");
    } catch {}
  }

  async function handleDelete(commentId: number) {
    try {
      await deleteListComment(listId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {}
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
          Comments
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        {comments.length > 0 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">{comments.length}</span>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No comments yet.</p>
      ) : (
        <div className="space-y-1 mb-5">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800 group/comment">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 mr-2">{c.username}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{c.content}</span>
              </div>
              {currentUser && currentUser.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover/comment:opacity-100 shrink-0"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {currentUser && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none py-1.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
          <button
            type="submit"
            className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors px-1"
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
}
