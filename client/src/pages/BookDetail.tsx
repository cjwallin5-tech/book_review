import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageCircle, BookOpen, Check, Trash2 } from "lucide-react";

const FICTION_GENRES = new Set([
  "Fiction", "Science Fiction", "Fantasy", "Romance", "Mystery", "Thriller",
  "Historical Fiction", "Adventure", "Crime", "Young Adult", "Children", "Drama", "Horror",
]);
const NONFICTION_GENRES = new Set([
  "Non-Fiction", "History", "Biography", "Memoir", "Self-Help",
  "Philosophy", "Psychology", "Poetry", "Graphic Novel",
]);

function computeGenres(genre: string): string[] {
  if (!genre) return [];
  const result = new Set([genre]);
  if (FICTION_GENRES.has(genre) && genre !== "Fiction") result.add("Fiction");
  if (NONFICTION_GENRES.has(genre) && genre !== "Non-Fiction") result.add("Non-Fiction");
  return [...result];
}
import type { BookDetail as BookDetailType, ReviewComment, SeriesBook, Book } from "../api";
import {
  getBook,
  addReview,
  deleteReview,
  addTbr,
  removeTbr,
  getTbrStatus,
  getReadStatus,
  toggleReadServer,
  addDiaryEntry,
  getLists,
  addBookToList,
  likeReview,
  unlikeReview,
  getReviewComments,
  addReviewComment,
  getBookReadingStatus,
  toggleReadingStatus,
  getSimilarBooks,
  getReadingProgress,
  updateReadingProgress,
} from "../api";
import { useAuth } from "../context/AuthContext";

// Gradient style used for both display and input half-stars
const HALF_STAR_STYLE: React.CSSProperties = {
  background: "linear-gradient(90deg, #34d399 50%, #6b7280 50%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-lg leading-none">
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

function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const display = hover > 0 ? hover : value;

  function getVal(e: React.MouseEvent<HTMLButtonElement>, n: number) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    return e.clientX - left < width / 2 ? n - 0.5 : n;
  }

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="text-3xl leading-none w-9 focus:outline-none"
          onMouseMove={(e) => setHover(getVal(e, n))}
          onMouseLeave={() => setHover(0)}
          onClick={(e) => onChange(getVal(e, n))}
        >
          {display >= n ? (
            <span className="text-blue-400">★</span>
          ) : display >= n - 0.5 ? (
            <span style={HALF_STAR_STYLE}>★</span>
          ) : (
            <span className="text-gray-600 dark:text-gray-500">★</span>
          )}
        </button>
      ))}
      {display > 0 && (
        <span className="ml-2 text-sm text-gray-400 dark:text-gray-500 tabular-nums">
          {display % 1 === 0 ? `${display}.0` : `${display}`} / 5
        </span>
      )}
    </div>
  );
}

function RatingHistogram({ reviews }: { reviews: any[] }) {
  const counts = [1, 2, 3, 4, 5].map(
    (r) => reviews.filter((v) => Math.round(v.rating) === r).length
  );
  const max = Math.max(...counts, 1);
  return (
    <div className="space-y-1 mt-2">
      {[5, 4, 3, 2, 1].map((r) => (
        <div key={r} className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-3 text-right">{r}</span>
          <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(counts[r - 1] / max) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 w-4 text-right">{counts[r - 1]}</span>
        </div>
      ))}
    </div>
  );
}

function SeriesShelf({ book, isRead }: { book: BookDetailType; isRead: boolean }) {
  if (!book.series || book.series_books.length === 0) return null;

  const extendedSeriesBooks = book.series_books as (SeriesBook & { id: number; is_read?: number })[];
  const all = [
    ...extendedSeriesBooks,
    { id: book.id, title: book.title, cover_url: book.cover_url, series_order: book.series_order, avg_rating: book.avg_rating, review_count: book.review_count, is_read: isRead ? 1 : 0 },
  ].sort((a, b) => {
    if (a.series_order !== b.series_order) return a.series_order - b.series_order;
    return a.title.localeCompare(b.title);
  });

  const readCount = all.filter(s => s.is_read).length;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {book.series} Series
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{readCount}/{all.length} read</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {all.map((s) => {
          const isCurrent = s.id === book.id;
          return (
            <Link
              key={s.id}
              to={`/books/${s.id}`}
              className={`group relative w-24 shrink-0 ${isCurrent ? "pointer-events-none" : ""}`}
              title={s.title}
            >
              <div className={`relative rounded-lg overflow-hidden shadow ${isCurrent ? "ring-2 ring-blue-400" : "opacity-80 hover:opacity-100 transition-opacity"}`}>
                <img
                  src={s.cover_url}
                  alt={s.title}
                  className="w-full aspect-[2/3] object-cover"
                  loading="lazy"
                />
                {isCurrent && (
                  <div className="absolute inset-0 bg-blue-500/10" />
                )}
                {s.is_read && !isCurrent && (
                  <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
                {s.series_order > 0 && (
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    #{s.series_order}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] leading-tight text-gray-700 dark:text-gray-300 line-clamp-2 text-center">
                {s.title}
              </p>
              {s.review_count > 0 && (
                <p className="text-[10px] text-blue-500 dark:text-blue-400 text-center mt-0.5">
                  ★ {Number(s.avg_rating).toFixed(1)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  bookId,
  user,
  onDelete,
}: {
  review: any;
  bookId: number;
  user: any;
  onDelete: (reviewId: number) => void;
}) {
  const [liked, setLiked] = useState(review.is_liked);
  const [likeCount, setLikeCount] = useState(review.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this review?")) return;
    setDeleting(true);
    try {
      await deleteReview(bookId, review.id);
      onDelete(review.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleLike() {
    if (!user) return;
    try {
      if (liked) {
        await unlikeReview(bookId, review.id);
        setLiked(false);
        setLikeCount((c: number) => c - 1);
      } else {
        await likeReview(bookId, review.id);
        setLiked(true);
        setLikeCount((c: number) => c + 1);
      }
    } catch {}
  }

  async function toggleComments() {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const c = await getReviewComments(bookId, review.id);
      setComments(c);
    } catch {}
    setLoadingComments(false);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    try {
      const c = await addReviewComment(bookId, review.id, commentText.trim());
      setComments((prev: ReviewComment[]) => [...prev, c]);
      setCommentText("");
    } catch {}
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm dark:shadow-none p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.user_name}</span>
        <div className="flex items-center gap-2">
          <StarRatingDisplay rating={review.rating} />
          {user && review.user_id === user.id && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete review"
              className="text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{review.content}</p>
      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
        {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-3 flex items-center gap-4">
        {user ? (
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              liked ? "text-red-400" : "text-gray-400 dark:text-gray-500 hover:text-red-400"
            }`}
          >
            <Heart size={13} fill={liked ? "currentColor" : "none"} />
            <span>{likeCount}</span>
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Heart size={13} />
            <span>{likeCount}</span>
          </span>
        )}
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-400 transition-colors"
        >
          <MessageCircle size={13} />
          <span>{review.comment_count}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-700/50 pt-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium text-blue-500 dark:text-blue-400">{c.username}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">{c.content}</span>
              </div>
            ))
          )}
          {user && (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-sm rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors"
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState<BookDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [inTbr, setInTbr] = useState(false);
  const [read, setRead] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReviewId, setUserReviewId] = useState<number | null>(null);
  const [removingRating, setRemovingRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [diaryStart, setDiaryStart] = useState(new Date().toISOString().slice(0, 10));
  const [diaryEnd, setDiaryEnd] = useState("");
  const [diaryFormat, setDiaryFormat] = useState("paperback");
  const [showListPicker, setShowListPicker] = useState(false);
  const [userLists, setUserLists] = useState<{ id: number; title: string }[]>([]);
  const [listMsg, setListMsg] = useState("");
  const [currentlyReading, setCurrentlyReading] = useState(false);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [progressPage, setProgressPage] = useState("");
  const [progressTotal, setProgressTotal] = useState("");
  const [progressSaved, setProgressSaved] = useState(false);

  const loadData = useCallback(async (bookId: number) => {
    const [b, similar] = await Promise.all([
      getBook(bookId),
      getSimilarBooks(bookId),
    ]);
    setBook(b);
    setUserRating(b.user_rating);
    setUserReviewId(b.user_review_id);
    setSimilarBooks(similar);
    if (user) {
      try {
        const [readStatus, readingStatus, tbrStatus, prog] = await Promise.all([
          getReadStatus(bookId),
          getBookReadingStatus(bookId),
          getTbrStatus(bookId),
          getReadingProgress(bookId),
        ]);
        setRead(readStatus);
        setCurrentlyReading(readingStatus);
        setInTbr(tbrStatus);
        if (prog.current_page > 0) setProgressPage(String(prog.current_page));
        if (prog.total_pages) setProgressTotal(String(prog.total_pages));
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const bookId = Number(id);
    setLoading(true);
    loadData(bookId).finally(() => setLoading(false));
  }, [id, loadData]);

  async function toggleTbr() {
    if (!book || !user) return;
    try {
      if (inTbr) {
        await removeTbr(book.id);
        setInTbr(false);
      } else {
        await addTbr(book.id);
        setInTbr(true);
      }
    } catch {}
  }

  async function handleToggleRead() {
    if (!book || !user) return;
    try {
      const nowRead = await toggleReadServer(book.id);
      setRead(nowRead);
    } catch {}
  }

  async function handleLogToDiary(e: React.FormEvent) {
    e.preventDefault();
    if (!book || !user) return;
    try {
      await addDiaryEntry(book.id, diaryStart, diaryEnd || null, diaryFormat);
      setShowDiaryForm(false);
      setDiaryStart(new Date().toISOString().slice(0, 10));
      setDiaryEnd("");
      setDiaryFormat("paperback");
    } catch {}
  }

  async function openListPicker() {
    if (!user) return;
    try {
      const lists = await getLists();
      setUserLists(lists.filter((l) => l.user_id === user.id));
      setShowListPicker(true);
      setListMsg("");
    } catch {}
  }

  async function handleAddToList(listId: number) {
    if (!book) return;
    try {
      await addBookToList(listId, book.id);
      setListMsg("Added!");
      setTimeout(() => setListMsg(""), 2000);
    } catch {
      setListMsg("Already in list");
      setTimeout(() => setListMsg(""), 2000);
    }
  }

  async function handleToggleCurrentlyReading() {
    if (!book || !user) return;
    try {
      const nowReading = await toggleReadingStatus(book.id);
      setCurrentlyReading(nowReading);
    } catch {}
  }

  async function handleSaveProgress() {
    if (!book || !user) return;
    const page = parseInt(progressPage, 10);
    const total = progressTotal ? parseInt(progressTotal, 10) : undefined;
    if (!page || page < 0) return;
    try {
      await updateReadingProgress(book.id, page, total);
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 2000);
    } catch {}
  }

  async function handleQuickRate(newRating: number) {
    if (!id || !user) return;
    try {
      const review = await addReview(Number(id), { rating: newRating, content: "" });
      setUserRating(newRating);
      setUserReviewId(review.id);
      setRead(true);
      setBook((prev) => {
        if (!prev) return prev;
        // If user already had a rating, replace it in the average; otherwise add it
        const prevRating = userRating;
        if (prevRating !== null) {
          const totalWithout = prev.avg_rating * prev.review_count - prevRating;
          return { ...prev, avg_rating: (totalWithout + newRating) / prev.review_count };
        }
        return {
          ...prev,
          review_count: prev.review_count + 1,
          avg_rating: (prev.avg_rating * prev.review_count + newRating) / (prev.review_count + 1),
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemoveRating() {
    if (!book || !user || userReviewId === null) return;
    setRemovingRating(true);
    try {
      await deleteReview(book.id, userReviewId);
      const removedRating = userRating ?? 0;
      setBook((prev) => {
        if (!prev) return prev;
        const remaining = prev.review_count - 1;
        return {
          ...prev,
          reviews: prev.reviews.filter((r) => r.id !== userReviewId),
          review_count: remaining,
          avg_rating: remaining > 0 ? (prev.avg_rating * prev.review_count - removedRating) / remaining : 0,
        };
      });
      setUserRating(null);
      setUserReviewId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingRating(false);
    }
  }

  function handleReviewDeleted(reviewId: number) {
    setBook((prev) => {
      if (!prev) return prev;
      const removed = prev.reviews.find((r) => r.id === reviewId);
      if (!removed) return prev;
      const remaining = prev.review_count - 1;
      return {
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== reviewId),
        review_count: remaining,
        avg_rating: remaining > 0 ? (prev.avg_rating * prev.review_count - removed.rating) / remaining : 0,
      };
    });
    if (reviewId === userReviewId) {
      setUserRating(null);
      setUserReviewId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user) return;
    setSubmitting(true);
    try {
      const review = await addReview(Number(id), { rating, content: content.trim() });
      const enriched = {
        ...review,
        like_count: 0,
        comment_count: 0,
        is_liked: false,
      };
      setBook((prev) =>
        prev
          ? {
              ...prev,
              reviews: [enriched, ...prev.reviews],
              review_count: prev.review_count + 1,
              avg_rating:
                (prev.avg_rating * prev.review_count + rating) /
                (prev.review_count + 1),
            }
          : prev
      );
      setUserRating(rating);
      setUserReviewId(review.id);
      setRating(5);
      setContent("");
      setRead(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!book) return <p className="text-gray-500 dark:text-gray-400">Book not found.</p>;

  return (
    <div>
      <Link to="/" className="text-sm text-blue-500 dark:text-blue-400 hover:underline">
        &larr; Back to books
      </Link>

      <div className="mt-4 flex flex-col sm:flex-row gap-8">
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-full sm:w-64 aspect-[2/3] object-cover rounded-xl shadow-lg shrink-0"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
            <Link
              to={`/author/${encodeURIComponent(book.author)}`}
              className="hover:text-blue-500 dark:hover:text-blue-400 hover:underline"
            >
              {book.author}
            </Link>
          </p>
          {book.genre && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {computeGenres(book.genre).map((g) => (
                <span
                  key={g}
                  className={`text-xs px-2.5 py-0.5 rounded-full ${
                    g === "Fiction" || g === "Non-Fiction"
                      ? "ring-1 ring-blue-400/40 text-blue-300 bg-blue-500/10"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={book.avg_rating} />
              <span className="text-gray-600 dark:text-gray-300 font-semibold">
                {book.avg_rating.toFixed(1)}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                ({book.review_count} {book.review_count === 1 ? "review" : "reviews"} · {book.read_count} reads)
              </span>
            </div>
            {book.reviews.length > 0 && <RatingHistogram reviews={book.reviews} />}
          </div>

          <p className="mt-5 text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>

          {user && (
            <div className="mt-5">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Your rating</p>
              <div className="flex items-center gap-3">
                <StarRatingInput value={userRating ?? 0} onChange={handleQuickRate} />
                {userRating !== null && userReviewId !== null && (
                  <button
                    onClick={handleRemoveRating}
                    disabled={removingRating}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {removingRating ? "Removing..." : "Remove rating"}
                  </button>
                )}
              </div>
            </div>
          )}

          {user && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleToggleRead}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  read
                    ? "bg-blue-500 text-white hover:bg-blue-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {read ? <span className="flex items-center gap-1.5"><Check size={13} />Read</span> : "Mark as Read"}
              </button>
              <button
                onClick={handleToggleCurrentlyReading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentlyReading
                    ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <BookOpen size={14} />
                {currentlyReading ? "Currently Reading" : "Reading Now"}
              </button>
              <button
                onClick={toggleTbr}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inTbr
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {inTbr ? "Remove from Wishlist" : "+ Wishlist"}
              </button>
            </div>
          )}

          {user && currentlyReading && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Page</span>
              <input
                type="number"
                min="0"
                value={progressPage}
                onChange={(e) => setProgressPage(e.target.value)}
                placeholder="0"
                className="w-16 text-xs rounded border dark:border-gray-600 dark:bg-gray-800 dark:text-white px-2 py-1 text-center"
              />
              <span className="text-xs text-gray-500">/</span>
              <input
                type="number"
                min="1"
                value={progressTotal}
                onChange={(e) => setProgressTotal(e.target.value)}
                placeholder="total"
                className="w-16 text-xs rounded border dark:border-gray-600 dark:bg-gray-800 dark:text-white px-2 py-1 text-center"
              />
              <button
                onClick={handleSaveProgress}
                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-400 transition-colors font-medium"
              >
                {progressSaved ? "Saved" : "Save"}
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            {user && (
              <button
                onClick={() => setShowDiaryForm(!showDiaryForm)}
                className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
              >
                + Log to diary
              </button>
            )}
            {user && (
              <button
                onClick={openListPicker}
                className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
              >
                + Add to list
              </button>
            )}
          </div>

          {showDiaryForm && (
            <form onSubmit={handleLogToDiary} className="flex flex-wrap items-end gap-2 mt-3">
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Start</label>
                <input
                  type="date"
                  value={diaryStart}
                  onChange={(e) => setDiaryStart(e.target.value)}
                  required
                  className="text-xs rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">End</label>
                <input
                  type="date"
                  value={diaryEnd}
                  onChange={(e) => setDiaryEnd(e.target.value)}
                  className="text-xs rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1"
                />
              </div>
              <select
                value={diaryFormat}
                onChange={(e) => setDiaryFormat(e.target.value)}
                className="text-xs rounded border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1"
              >
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
                <option value="ebook">Ebook</option>
                <option value="audiobook">Audiobook</option>
              </select>
              <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">
                Save
              </button>
              <button type="button" onClick={() => setShowDiaryForm(false)} className="text-xs text-gray-500 hover:text-gray-400">
                Cancel
              </button>
            </form>
          )}

          {showListPicker && (
            <div className="mt-2">
              {userLists.length === 0 ? (
                <Link to="/lists/new" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
                  Create a list first
                </Link>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {userLists.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleAddToList(l.id)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {l.title}
                    </button>
                  ))}
                </div>
              )}
              {listMsg && <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{listMsg}</p>}
            </div>
          )}

          {!user && (
            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/login" className="text-blue-500 dark:text-blue-400 hover:underline">Sign in</Link> to track your reading
            </p>
          )}
        </div>
      </div>

      <SeriesShelf book={book} isRead={read} />

      {similarBooks.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Readers Also Enjoyed
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {similarBooks.map((s) => (
              <Link
                key={s.id}
                to={`/books/${s.id}`}
                className="group shrink-0 w-20"
                title={s.title}
              >
                <div className="relative rounded-md overflow-hidden bg-gray-800 shadow-md">
                  <img
                    src={s.cover_url}
                    alt={s.title}
                    className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400 leading-tight line-clamp-2">{s.title}</p>
                {s.review_count > 0 && (
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                    ★ {Number(s.avg_rating).toFixed(1)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        {user ? (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Write a Review</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Reviews</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
          </div>
        )}
        {!user ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            <Link to="/login" className="text-blue-500 dark:text-blue-400 hover:underline">Sign in</Link> to leave a review.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-md shadow-sm dark:shadow-none p-5 space-y-4 mb-10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reviewing as <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="What did you think? (leave blank to just submit your rating)"
                className="block w-full rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors font-medium"
            >
              {submitting ? "Submitting..." : content.trim() ? "Submit Review" : "Submit Rating"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-4">
        {(() => {
          const textReviews = book.reviews.filter((r) => r.content && r.content.trim());
          const featuredReview = textReviews.length > 0
            ? [...textReviews].sort((a, b) => b.like_count - a.like_count)[0]
            : null;
          const otherReviews = featuredReview
            ? textReviews.filter((r) => r.id !== featuredReview.id)
            : textReviews;

          return (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">Reviews</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700/60" />
                {textReviews.length > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{textReviews.length}</span>
                )}
              </div>
              {textReviews.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No written reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {featuredReview && featuredReview.like_count > 0 && (
                    <div className="border border-blue-500/30 rounded-md p-4 bg-blue-500/5 relative">
                      <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                        Top Review
                      </span>
                      <ReviewCard review={featuredReview} bookId={book.id} user={user} onDelete={handleReviewDeleted} />
                    </div>
                  )}
                  {(featuredReview && featuredReview.like_count > 0 ? otherReviews : textReviews).map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      bookId={book.id}
                      user={user}
                      onDelete={handleReviewDeleted}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
