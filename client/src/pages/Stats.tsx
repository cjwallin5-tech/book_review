import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserStats } from "../api";
import type { UserStats } from "../api";

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    const duration = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{count}</>;
}

const CURRENT_YEAR = new Date().getFullYear();

function getGoalKey(userId: string) {
  return `reading_goal_${userId}_${CURRENT_YEAR}`;
}

const HALF_STAR_STYLE: React.CSSProperties = {
  background: "linear-gradient(90deg, #34d399 50%, #6b7280 50%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex leading-none text-sm">
      {[1, 2, 3, 4, 5].map((n) =>
        rating >= n ? (
          <span key={n} className="text-blue-400">★</span>
        ) : rating >= n - 0.5 ? (
          <span key={n} style={HALF_STAR_STYLE}>★</span>
        ) : (
          <span key={n} className="text-gray-600">★</span>
        )
      )}
    </span>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
      {count !== undefined && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{count}</span>
      )}
    </div>
  );
}

function Bar({ fraction, color = "bg-blue-500" }: { fraction: number; color?: string }) {
  return (
    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`${color} h-full rounded-full transition-all duration-500`}
        style={{ width: `${Math.max(fraction * 100, fraction > 0 ? 2 : 0)}%` }}
      />
    </div>
  );
}

export default function Stats() {
  const { id } = useParams();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (!id) return;
    getUserStats(Number(id))
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
    const saved = localStorage.getItem(getGoalKey(id));
    if (saved) setGoal(Number(saved));
  }, [id]);

  function saveGoal() {
    const n = parseInt(goalInput, 10);
    if (!n || n < 1 || !id) return;
    localStorage.setItem(getGoalKey(id), String(n));
    setGoal(n);
    setGoalInput("");
  }

  function clearGoal() {
    if (!id) return;
    localStorage.removeItem(getGoalKey(id));
    setGoal(null);
  }

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading...</p>;
  if (!stats) return <p className="text-sm text-gray-400 dark:text-gray-500">Stats not found.</p>;

  const maxYear = Math.max(...stats.books_per_year.map((y) => y.count), 1);
  const maxRating = Math.max(...stats.rating_distribution.map((r) => r.count), 1);
  const maxGenre = Math.max(...stats.genre_breakdown.map((g) => g.count), 1);

  // Show ratings descending (5 → 0.5)
  const ratingsDesc = [...stats.rating_distribution].sort((a, b) => b.rating - a.rating);

  return (
    <div className="max-w-xl">
      <Link
        to={`/users/${id}`}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
      >
        ← {stats.username}
      </Link>

      <h1 className="mt-4 mb-8 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {stats.username}'s Stats
      </h1>

      {/* ── Top numbers ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-6 pb-8 border-b border-gray-100 dark:border-gray-800 mb-10">
        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
            <AnimatedNumber value={stats.total_read} />
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">
            Books Read
          </p>
        </div>

        <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800" />

        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
            <AnimatedNumber value={stats.read_this_year} />
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">
            This Year
          </p>
        </div>

        <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800" />

        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
            {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : "—"}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">
            Avg Rating
          </p>
        </div>

        {stats.current_streak > 0 && (
          <>
            <div className="w-px self-stretch bg-gray-100 dark:bg-gray-800" />
            <div>
              <p className="text-4xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white leading-none">
                <AnimatedNumber value={stats.current_streak} />
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">
                Day Streak
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Reading challenge ───────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {CURRENT_YEAR} Reading Goal
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        </div>
        {goal ? (
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {stats.read_this_year}
                <span className="text-base font-normal text-gray-400 dark:text-gray-500"> / {goal} books</span>
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {Math.min(100, Math.round((stats.read_this_year / goal) * 100))}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.read_this_year / goal) * 100)}%` }}
              />
            </div>
            {stats.read_this_year >= goal ? (
              <p className="mt-2 text-xs text-blue-500 dark:text-blue-400 font-medium">
                Goal complete! 🎉
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {goal - stats.read_this_year} more to go
              </p>
            )}
            <button
              onClick={clearGoal}
              className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400 transition-colors"
            >
              Remove goal
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder="e.g. 24"
              className="w-24 text-sm rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={saveGoal}
              className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Set goal
            </button>
          </div>
        )}
      </div>

      {/* ── Favorite author ─────────────────────────────────────────────────── */}
      {stats.favorite_author && (
        <div className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            Favorite Author
          </p>
          <Link
            to={`/author/${encodeURIComponent(stats.favorite_author)}`}
            className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {stats.favorite_author}
          </Link>
        </div>
      )}

      {/* ── Books per year ──────────────────────────────────────────────────── */}
      {stats.books_per_year.length > 0 && (
        <div className="mb-10">
          <SectionHeader label="Books Per Year" />
          <div className="space-y-3">
            {stats.books_per_year.map((y) => (
              <div key={y.year} className="flex items-center gap-3">
                <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400 w-10 shrink-0">
                  {y.year}
                </span>
                <Bar fraction={y.count / maxYear} />
                <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                  {y.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rating distribution ─────────────────────────────────────────────── */}
      {ratingsDesc.length > 0 && (
        <div className="mb-10">
          <SectionHeader label="Ratings" />
          <div className="space-y-3">
            {ratingsDesc.map((r) => (
              <div key={r.rating} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <StarDisplay rating={r.rating} />
                </div>
                <Bar fraction={r.count / maxRating} color="bg-blue-500" />
                <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Genre breakdown ─────────────────────────────────────────────────── */}
      {stats.genre_breakdown.length > 0 && (
        <div className="mb-10">
          <SectionHeader label="Genres" count={stats.genre_breakdown.length} />
          <div className="space-y-3">
            {stats.genre_breakdown.map((g) => (
              <div key={g.genre} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-32 shrink-0 truncate">
                  {g.genre || "Unknown"}
                </span>
                <Bar fraction={g.count / maxGenre} color="bg-blue-500/70" />
                <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                  {g.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.total_read === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No reading data yet.{" "}
          <Link to="/" className="text-blue-500 dark:text-blue-400 hover:underline">
            Mark some books as read
          </Link>{" "}
          to see your stats.
        </p>
      )}
    </div>
  );
}
