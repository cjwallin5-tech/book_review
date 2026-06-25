import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Pencil, Check, X, Plus, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Book, BookList, FavoriteBook, ReadingProgress, SeriesProgress } from "../api";
import {
  getTbrBooks, getReadBooks, getDiaryEntries,
  getCurrentlyReadingBooks, getFavoriteBooks, setFavoriteBooks,
  getUserLists, search, getAllReadingProgress, getSeriesProgress, getUserStats,
} from "../api";

function avatarColor(name: string): string {
  const palette = [
    "bg-blue-700", "bg-sky-700", "bg-violet-700",
    "bg-rose-700", "bg-amber-700", "bg-teal-700", "bg-indigo-700",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function Avatar({ username, avatarUrl, size = 80, onUpload }: {
  username: string; avatarUrl: string; size?: number; onUpload?: () => void;
}) {
  const initial = username.charAt(0).toUpperCase();
  const color = avatarColor(username);
  return (
    <button
      type="button"
      onClick={onUpload}
      className={`relative rounded-full overflow-hidden shrink-0 focus:outline-none ${onUpload ? "group cursor-pointer" : "cursor-default"}`}
      style={{ width: size, height: size }}
      disabled={!onUpload}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        <div className={`${color} w-full h-full flex items-center justify-center text-white font-bold select-none`} style={{ fontSize: size * 0.38 }}>
          {initial}
        </div>
      )}
      {onUpload && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera size={size * 0.28} className="text-white" />
        </div>
      )}
    </button>
  );
}

function FavoriteSlot({
  position, book, onPick, onRemove, editable,
}: {
  position: number;
  book: FavoriteBook | undefined;
  onPick: (position: number) => void;
  onRemove: (position: number) => void;
  editable: boolean;
}) {
  if (book) {
    return (
      <div className="group relative">
        <Link to={`/books/${book.id}`} className="block">
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-105"
          />
        </Link>
        {editable && (
          <button
            onClick={() => onRemove(position)}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Remove"
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="w-full aspect-[2/3] rounded-lg bg-gray-800 border border-gray-700/50 border-dashed" />
    );
  }

  return (
    <button
      onClick={() => onPick(position)}
      className="w-full aspect-[2/3] rounded-lg bg-gray-800 border-2 border-dashed border-gray-700 hover:border-blue-600 hover:bg-gray-750 transition-all flex items-center justify-center group"
      title={`Add book to slot ${position}`}
    >
      <Plus size={20} className="text-gray-600 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}

function FavoritePicker({
  onSelect, onClose,
}: {
  onSelect: (book: Book) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    search(q.trim(), "books")
      .then((r) => setResults(r.books))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [q]);

  return (
    <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a book…"
          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-500 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
          <X size={16} />
        </button>
      </div>
      {searching && <p className="text-xs text-gray-500 py-2">Searching…</p>}
      {!searching && q.trim() && results.length === 0 && (
        <p className="text-xs text-gray-500 py-2">No results found.</p>
      )}
      {results.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {results.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors text-left"
            >
              <img src={b.cover_url} alt={b.title} className="w-8 aspect-[2/3] object-cover rounded shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.author}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [tbrCount, setTbrCount] = useState(0);
  const [readBooks, setReadBooks] = useState<Book[]>([]);
  const [diaryCount, setDiaryCount] = useState(0);
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [userLists, setUserLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [progressMap, setProgressMap] = useState<Map<number, ReadingProgress>>(new Map());
  const [seriesInProgress, setSeriesInProgress] = useState<SeriesProgress[]>([]);
  const [streak, setStreak] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getTbrBooks().then((b) => setTbrCount(b.length)).catch(() => {}),
      getReadBooks().then(setReadBooks).catch(() => {}),
      getDiaryEntries().then((e) => setDiaryCount(e.length)).catch(() => {}),
      getCurrentlyReadingBooks().then(setCurrentlyReading).catch(() => {}),
      getFavoriteBooks(user.id).then(setFavorites).catch(() => {}),
      getUserLists(user.id).then(setUserLists).catch(() => {}),
      getAllReadingProgress().then((p) => setProgressMap(new Map(p.map((r) => [r.book_id, r])))).catch(() => {}),
      getSeriesProgress().then(setSeriesInProgress).catch(() => {}),
      getUserStats(user.id).then((s) => setStreak(s.current_streak)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const readCount = readBooks.length;

  function startEditBio() { setBioDraft(user!.bio || ""); setEditingBio(true); }
  async function saveBio() {
    setSavingBio(true);
    try { await updateProfile({ bio: bioDraft }); setEditingBio(false); } catch {}
    setSavingBio(false);
  }
  function cancelBio() { setEditingBio(false); setBioDraft(""); }

  function handleAvatarClick() { fileInputRef.current?.click(); }
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert("Please choose an image under 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try { await updateProfile({ avatar_url: ev.target?.result as string }); } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function getFavoriteAtSlot(pos: number): FavoriteBook | undefined {
    return favorites.find((f) => f.position === pos);
  }

  async function handlePickFavorite(book: Book) {
    if (editingSlot === null) return;
    const newFav: FavoriteBook = { ...book, position: editingSlot };
    const updated = [
      ...favorites.filter((f) => f.position !== editingSlot && f.id !== book.id),
      newFav,
    ];
    setFavorites(updated);
    setEditingSlot(null);
    await setFavoriteBooks(updated.map((f) => ({ position: f.position, book_id: f.id }))).catch(() => {});
  }

  async function handleRemoveFavorite(position: number) {
    const updated = favorites.filter((f) => f.position !== position);
    setFavorites(updated);
    await setFavoriteBooks(updated.map((f) => ({ position: f.position, book_id: f.id }))).catch(() => {});
  }

  return (
    <div className="max-w-3xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-5 mb-8">
        <Avatar username={user.username} avatarUrl={user.avatar_url} size={88} onUpload={handleAvatarClick} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">
            {user.username}
          </h1>

          {editingBio ? (
            <div className="mt-2">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Tell people a bit about yourself…"
                autoFocus
                className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button onClick={saveBio} disabled={savingBio} className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50">
                  <Check size={13} /> Save
                </button>
                <button onClick={cancelBio} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                  <X size={13} /> Cancel
                </button>
                <span className="ml-auto text-[11px] text-gray-400">{bioDraft.length}/300</span>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-start gap-2 group/bio">
              {user.bio ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No bio yet</p>
              )}
              <button onClick={startEditBio} className="shrink-0 mt-0.5 opacity-0 group-hover/bio:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Edit bio">
                <Pencil size={12} />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 flex-wrap">
            {loading ? <span className="text-xs">Loading…</span> : (
              <>
                <span className="text-gray-700 dark:text-gray-300 font-semibold">{readCount}</span>
                <span className="mr-2">read</span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-700 dark:text-gray-300 font-semibold ml-2">{tbrCount}</span>
                <span className="mr-2"><Link to="/to-read" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">wishlist</Link></span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-700 dark:text-gray-300 font-semibold ml-2">{diaryCount}</span>
                <span className="mr-2"><Link to="/diary" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">diary entries</Link></span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                {streak > 0 && (
                  <>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold ml-2">{streak}</span>
                    <span className="mr-2">day streak</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                  </>
                )}
                <Link to={`/stats/${user.id}`} className="ml-2 text-xs font-medium text-blue-500 dark:text-blue-400 hover:underline">Stats →</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Favorite Books ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
            Favorite Books
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          <span className="text-[10px] text-gray-500 dark:text-gray-600">click to edit</span>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
            {[1, 2, 3, 4].map((pos) => (
              <FavoriteSlot
                key={pos}
                position={pos}
                book={getFavoriteAtSlot(pos)}
                onPick={(p) => setEditingSlot(editingSlot === p ? null : p)}
                onRemove={handleRemoveFavorite}
                editable
              />
            ))}
          </div>
        </div>

        {editingSlot !== null && (
          <FavoritePicker onSelect={handlePickFavorite} onClose={() => setEditingSlot(null)} />
        )}
      </div>

      {/* ── Currently reading ───────────────────────────────────────────────── */}
      {!loading && currentlyReading.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Currently Reading</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {currentlyReading.map((book) => {
              const prog = progressMap.get(book.id);
              const pct = prog?.total_pages ? Math.min(100, (prog.current_page / prog.total_pages) * 100) : 0;
              return (
                <Link key={book.id} to={`/books/${book.id}`} className="group shrink-0 w-16" title={book.title}>
                  <div className="relative rounded overflow-hidden bg-gray-800 shadow-md">
                    <img src={book.cover_url} alt={book.title} className="w-full aspect-[2/3] object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div className="h-full bg-sky-400 rounded-full transition-all duration-300" style={{ width: `${pct || 4}%` }} />
                    </div>
                  </div>
                  {prog?.total_pages ? (
                    <p className="mt-0.5 text-[9px] text-gray-600 leading-none tabular-nums">{prog.current_page}/{prog.total_pages}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Unfinished Series ───────────────────────────────────────────────── */}
      {!loading && seriesInProgress.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Unfinished Series</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          </div>
          <div className="space-y-5">
            {seriesInProgress.map((s) => (
              <div key={s.series}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-200">{s.series}</span>
                  <span className="text-xs text-gray-500">{s.read_count} / {s.total}</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {s.books.map((b) => (
                    <Link
                      key={b.id}
                      to={`/books/${b.id}`}
                      title={b.title}
                      className="group shrink-0 w-12 relative"
                    >
                      <div className={`relative rounded overflow-hidden ${b.is_read ? "" : "opacity-40"}`}>
                        <img src={b.cover_url} alt={b.title} className="w-full aspect-[2/3] object-cover transition-opacity group-hover:opacity-100" loading="lazy" />
                        {b.is_read ? (
                          <span className="absolute top-0.5 right-0.5 bg-blue-500 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">
                            <Check size={8} strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Books read grid ─────────────────────────────────────────────────── */}
      {!loading && readBooks.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Books Read</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{readCount}</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-1.5">
            {readBooks.slice(0, 48).map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} title={book.title} className="group relative rounded overflow-hidden">
                <img src={book.cover_url} alt={book.title} className="w-full aspect-[2/3] object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
              </Link>
            ))}
          </div>
          {readBooks.length > 48 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">+{readBooks.length - 48} more</p>
          )}
        </div>
      )}

      {!loading && readBooks.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
          No books marked as read yet.{" "}
          <Link to="/" className="text-blue-500 dark:text-blue-400 hover:underline">Browse books</Link>{" "}
          to get started.
        </p>
      )}

      {/* ── My Lists ────────────────────────────────────────────────────────── */}
      {!loading && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">My Lists</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
            <Link to="/lists/new" className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1">
              <Plus size={12} /> New list
            </Link>
          </div>
          {userLists.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              No lists yet.{" "}
              <Link to="/lists/new" className="text-blue-500 dark:text-blue-400 hover:underline">Create one</Link>
            </p>
          ) : (
            <div className="space-y-1">
              {userLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="group flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 shrink-0">
                    {list.cover_url ? (
                      <img src={list.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors truncate">{list.title}</p>
                      {list.is_private === 1 && <Lock size={10} className="text-gray-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{list.item_count} {list.item_count === 1 ? "book" : "books"}</p>
                  </div>
                  {list.like_count > 0 && (
                    <span className="text-xs text-gray-500 shrink-0">♥ {list.like_count}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
