import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile, followUser, unfollowUser, getUserStats,
  getFavoriteBooks, getUserLists,
} from "../api";
import type { UserProfile as UserProfileType, UserStats, FavoriteBook, BookList } from "../api";

function avatarColor(name: string): string {
  const palette = [
    "bg-blue-700", "bg-sky-700", "bg-violet-700",
    "bg-rose-700", "bg-amber-700", "bg-teal-700", "bg-indigo-700",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [userLists, setUserLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getUserProfile(Number(id)).then(setProfile),
      getUserStats(Number(id)).then(setStats),
      getFavoriteBooks(Number(id)).then(setFavorites),
      getUserLists(Number(id)).then(setUserLists),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (profile) setIsFollowing(profile.is_following);
  }, [profile]);

  async function handleFollow() {
    if (!currentUser) { navigate("/login"); return; }
    if (!profile) return;
    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, followers_count: p.followers_count - 1 } : p);
      } else {
        await followUser(profile.id);
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
      }
    } catch {}
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 mt-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-800" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-800 rounded w-32" />
          <div className="h-3 bg-gray-800 rounded w-24" />
        </div>
      </div>
    </div>
  );
  if (!profile) return <p className="text-gray-500 dark:text-gray-400">User not found.</p>;

  const initial = profile.username.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${avatarColor(profile.username)} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span><span className="font-semibold text-gray-300">{profile.followers_count}</span> followers</span>
              <span><span className="font-semibold text-gray-300">{profile.following_count}</span> following</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser && currentUser.id !== profile.id && (
            <button
              onClick={handleFollow}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? "bg-gray-700 text-gray-300 hover:bg-red-900/40 hover:text-red-400"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <Link
            to={`/stats/${profile.id}`}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Stats
          </Link>
        </div>
      </div>

      {/* ── Favorite Books ──────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
            Favorite Books
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
            {[1, 2, 3, 4].map((pos) => {
              const book = favorites.find((f) => f.position === pos);
              if (book) {
                return (
                  <Link key={pos} to={`/books/${book.id}`} className="group block">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-105"
                    />
                  </Link>
                );
              }
              return (
                <div key={pos} className="w-full aspect-[2/3] rounded-lg bg-gray-800 border border-gray-700/40 border-dashed" />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-800">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-100 tabular-nums">{profile.read_count}</p>
          <p className="text-xs text-gray-500 mt-1">Books Read</p>
        </div>
        <div className="w-px self-stretch bg-gray-800" />
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-100 tabular-nums">{profile.review_count}</p>
          <p className="text-xs text-gray-500 mt-1">Reviews</p>
        </div>
        {stats && stats.read_this_year > 0 && (
          <>
            <div className="w-px self-stretch bg-gray-800" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-100 tabular-nums">{stats.read_this_year}</p>
              <p className="text-xs text-gray-500 mt-1">This Year</p>
            </div>
          </>
        )}
        {stats && stats.average_rating > 0 && (
          <>
            <div className="w-px self-stretch bg-gray-800" />
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400 tabular-nums">{stats.average_rating.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
            </div>
          </>
        )}
      </div>

      {/* ── Lists ───────────────────────────────────────────────────────────── */}
      {userLists.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Lists
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
            <span className="text-[11px] text-gray-500">{userLists.length}</span>
          </div>
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
        </div>
      )}
    </div>
  );
}
