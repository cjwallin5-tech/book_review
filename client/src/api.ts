const API = "/api";

// Rewrite Open Library cover URLs to go through our local proxy cache
const OL_COVER_RE = /covers\.openlibrary\.org\/b\/id\/(\d+)-[SML]\.jpg/;
function proxyCover(url: string | null | undefined): string {
  if (!url) return url ?? "";
  const m = url.match(OL_COVER_RE);
  return m ? `${API}/covers/${m[1]}` : url;
}
function pc<T extends { cover_url: string }>(b: T): T {
  return { ...b, cover_url: proxyCover(b.cover_url) };
}

export interface Book {
  id: number;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  genre: string;
  country: string;
  series: string;
  series_order: number;
  avg_rating: number;
  review_count: number;
  read_count: number;
  created_at: string;
}

export interface SeriesBook {
  id: number;
  title: string;
  cover_url: string;
  series_order: number;
  avg_rating: number;
  review_count: number;
}

export interface Review {
  id: number;
  book_id: number;
  user_id: number | null;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

export interface ReviewComment {
  id: number;
  review_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface ListComment {
  id: number;
  list_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface BookDetail extends Book {
  reviews: Review[];
  series_books: SeriesBook[];
  user_rating: number | null;
  user_review_id: number | null;
}

// --- Token management ---

const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Auth API ---

export async function register(
  username: string,
  password: string,
  email: string
): Promise<{ token: string; user: { id: number; username: string } }> {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: { id: number; username: string } }> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function getMe(): Promise<{ id: number; username: string; bio: string; avatar_url: string; created_at: string }> {
  const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function updateProfile(data: { bio?: string; avatar_url?: string }): Promise<{ bio: string; avatar_url: string }> {
  const res = await fetch(`${API}/auth/profile`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// --- Book API ---

export async function getBooksByAuthor(author: string): Promise<Book[]> {
  const res = await fetch(`${API}/books?author=${encodeURIComponent(author)}`);
  if (!res.ok) throw new Error("Failed to fetch books by author");
  return (await res.json() as Book[]).map(pc);
}

export async function getBooks(sort?: string): Promise<Book[]> {
  const params = sort ? `?sort=${sort}` : "";
  const res = await fetch(`${API}/books${params}`);
  if (!res.ok) throw new Error("Failed to fetch books");
  return (await res.json() as Book[]).map(pc);
}

export async function getBook(id: number): Promise<BookDetail> {
  const res = await fetch(`${API}/books/${id}`);
  if (!res.ok) throw new Error("Failed to fetch book");
  return pc(await res.json() as BookDetail);
}

export async function addReview(
  bookId: number,
  data: { rating: number; content?: string }
): Promise<Review> {
  const res = await fetch(`${API}/books/${bookId}/reviews`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add review");
  return res.json();
}

export async function deleteReview(bookId: number, reviewId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete review");
}

export interface OpenLibraryBook {
  title: string;
  author: string;
  cover_url: string;
  description: string;
  olid: string;
}

export async function searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
  const res = await fetch(`${API}/books/search/open-library?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search");
  return res.json();
}

export async function addBook(
  data: { title: string; author: string; cover_url: string; description: string }
): Promise<Book> {
  const res = await fetch(`${API}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add book");
  return res.json();
}

export async function getSimilarBooks(bookId: number): Promise<Book[]> {
  const res = await fetch(`${API}/books/${bookId}/similar`);
  if (!res.ok) throw new Error("Failed to fetch similar books");
  return (await res.json() as Book[]).map(pc);
}

// --- TBR (server-side, authenticated) ---

export async function getTbrBooks(): Promise<Book[]> {
  const res = await fetch(`${API}/books/tbr/list`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch TBR books");
  return (await res.json() as Book[]).map(pc);
}

export async function addTbr(bookId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/tbr`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to add to TBR");
}

export async function removeTbr(bookId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/tbr`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove from TBR");
}

export async function getTbrStatus(bookId: number): Promise<boolean> {
  const res = await fetch(`${API}/books/${bookId}/tbr`, { headers: authHeaders() });
  if (!res.ok) return false;
  const data = await res.json();
  return data.inTbr as boolean;
}

// --- Read status (server-side, authenticated) ---

export async function getReadBooks(): Promise<Book[]> {
  const res = await fetch(`${API}/books/read/list`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch read books");
  return (await res.json() as Book[]).map(pc);
}

export async function toggleReadServer(bookId: number): Promise<boolean> {
  const res = await fetch(`${API}/books/${bookId}/read`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to toggle read status");
  const data = await res.json();
  return data.message === "Marked as read";
}

export async function getReadStatus(bookId: number): Promise<boolean> {
  const res = await fetch(`${API}/books/${bookId}/read-status`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch read status");
  const data = await res.json();
  return data.read;
}

// --- Friends Reading ---

export async function getFriendsReading(): Promise<Book[]> {
  const res = await fetch(`${API}/books/friends/reading`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch friends reading");
  return (await res.json() as Book[]).map(pc);
}

// --- Currently Reading ---

export async function getCurrentlyReadingBooks(): Promise<Book[]> {
  const res = await fetch(`${API}/books/reading/list`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch currently reading books");
  return (await res.json() as Book[]).map(pc);
}

export async function getBookReadingStatus(bookId: number): Promise<boolean> {
  const res = await fetch(`${API}/books/${bookId}/reading-status`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch reading status");
  const data = await res.json();
  return data.reading;
}

export async function toggleReadingStatus(bookId: number): Promise<boolean> {
  const res = await fetch(`${API}/books/${bookId}/reading`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to toggle reading status");
  const data = await res.json();
  return data.reading;
}

// --- Diary ---

export interface DiaryEntry {
  id: number;
  user_id: number;
  book_id: number;
  start_date: string;
  end_date: string | null;
  format: string;
  created_at: string;
  title: string;
  author: string;
  cover_url: string;
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  const res = await fetch(`${API}/books/diary/list`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch diary");
  return (await res.json() as DiaryEntry[]).map(pc);
}

export async function addDiaryEntry(bookId: number, start_date: string, end_date: string | null, format: string): Promise<DiaryEntry> {
  const res = await fetch(`${API}/books/${bookId}/diary`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ start_date, end_date, format }),
  });
  if (!res.ok) throw new Error("Failed to add diary entry");
  return res.json();
}

export async function removeDiaryEntry(entryId: number): Promise<void> {
  const res = await fetch(`${API}/books/diary/${entryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove diary entry");
}

// --- Lists ---

export interface BookList {
  id: number;
  user_id: number;
  username: string;
  title: string;
  description: string;
  is_private: number;
  item_count: number;
  cover_url: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookListItem {
  id: number;
  list_id: number;
  book_id: number;
  position: number;
  title: string;
  author: string;
  cover_url: string;
}

export interface BookListDetail extends BookList {
  items: BookListItem[];
  is_liked: boolean;
}

export async function getLists(): Promise<BookList[]> {
  const res = await fetch(`${API}/lists`);
  if (!res.ok) throw new Error("Failed to fetch lists");
  return res.json();
}

export async function getList(id: number): Promise<BookListDetail> {
  const res = await fetch(`${API}/lists/${id}`);
  if (!res.ok) throw new Error("Failed to fetch list");
  const data = await res.json() as BookListDetail;
  return { ...data, items: data.items.map(pc) };
}

export async function createList(title: string, description: string, is_private?: boolean): Promise<BookList> {
  const res = await fetch(`${API}/lists`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, is_private }),
  });
  if (!res.ok) throw new Error("Failed to create list");
  return res.json();
}

export async function updateList(id: number, data: { title?: string; description?: string; is_private?: boolean }): Promise<BookList> {
  const res = await fetch(`${API}/lists/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update list");
  return res.json();
}

export async function likeList(listId: number): Promise<void> {
  const res = await fetch(`${API}/lists/${listId}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to like list");
}

export async function unlikeList(listId: number): Promise<void> {
  const res = await fetch(`${API}/lists/${listId}/like`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to unlike list");
}

export async function deleteList(id: number): Promise<void> {
  const res = await fetch(`${API}/lists/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete list");
}

export async function addBookToList(listId: number, bookId: number): Promise<void> {
  const res = await fetch(`${API}/lists/${listId}/items`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId }),
  });
  if (!res.ok) throw new Error("Failed to add book to list");
}

export async function removeBookFromList(listId: number, bookId: number): Promise<void> {
  const res = await fetch(`${API}/lists/${listId}/items/${bookId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove book from list");
}

// --- Feed ---

export type FeedItem = {
  type: "review";
  id: number;
  date: string;
  rating: number;
  content: string;
  book_id: number;
  title: string;
  author: string;
  cover_url: string;
  user_id: number;
  username: string;
} | {
  type: "diary";
  id: number;
  date: string;
  start_date: string;
  end_date: string | null;
  format: string;
  book_id: number;
  title: string;
  author: string;
  cover_url: string;
  user_id: number;
  username: string;
} | {
  type: "list";
  id: number;
  date: string;
  title: string;
  description: string;
  user_id: number;
  username: string;
};

export async function getFeed(following?: boolean): Promise<FeedItem[]> {
  const params = following ? "?following=true" : "";
  const res = await fetch(`${API}/feed${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch feed");
  const items = await res.json() as FeedItem[];
  return items.map(item => "cover_url" in item && item.cover_url ? { ...item, cover_url: proxyCover(item.cover_url) } : item);
}

// --- Users & Follow ---

export interface UserProfile {
  id: number;
  username: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  read_count: number;
  review_count: number;
  is_following: boolean;
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await fetch(`${API}/users/${userId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function followUser(userId: number): Promise<void> {
  const res = await fetch(`${API}/users/${userId}/follow`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to follow user");
}

export async function unfollowUser(userId: number): Promise<void> {
  const res = await fetch(`${API}/users/${userId}/follow`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to unfollow user");
}

// --- Stats ---

export interface UserStats {
  username: string;
  total_read: number;
  read_this_year: number;
  books_per_year: { year: string; count: number }[];
  rating_distribution: { rating: number; count: number }[];
  average_rating: number;
  favorite_author: string | null;
  current_streak: number;
  genre_breakdown: { genre: string; count: number }[];
}

export interface FavoriteBook extends Book {
  position: number;
}

export async function getFavoriteBooks(userId: number): Promise<FavoriteBook[]> {
  const res = await fetch(`${API}/users/${userId}/favorites`);
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export async function setFavoriteBooks(
  favorites: { position: number; book_id: number }[]
): Promise<void> {
  const res = await fetch(`${API}/users/favorites`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ favorites }),
  });
  if (!res.ok) throw new Error("Failed to update favorites");
}

export async function getUserLists(userId: number): Promise<BookList[]> {
  const res = await fetch(`${API}/users/${userId}/lists`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user lists");
  return res.json();
}

export async function getUserStats(userId: number): Promise<UserStats> {
  const res = await fetch(`${API}/stats/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// --- Review likes ---

export async function likeReview(bookId: number, reviewId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to like review");
}

export async function unlikeReview(bookId: number, reviewId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}/like`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to unlike review");
}

// --- Review comments ---

export async function getReviewComments(bookId: number, reviewId: number): Promise<ReviewComment[]> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function addReviewComment(bookId: number, reviewId: number, content: string): Promise<ReviewComment> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}/comments`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function deleteReviewComment(bookId: number, reviewId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API}/books/${bookId}/reviews/${reviewId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete comment");
}

// --- List comments ---

export async function getListComments(listId: number): Promise<ListComment[]> {
  const res = await fetch(`${API}/lists/${listId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function addListComment(listId: number, content: string): Promise<ListComment> {
  const res = await fetch(`${API}/lists/${listId}/comments`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function deleteListComment(listId: number, commentId: number): Promise<void> {
  const res = await fetch(`${API}/lists/${listId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete comment");
}

// --- Discussions ---

export interface DiscussionCategory {
  id: number;
  name: string;
  description: string;
  position: number;
  thread_count: number;
  created_at: string;
}

export interface DiscussionThread {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  body: string;
  post_count: number;
  username: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionPost {
  id: number;
  thread_id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export async function getDiscussionCategories(): Promise<DiscussionCategory[]> {
  const res = await fetch(`${API}/discussions/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function getCategoryThreads(categoryId: number): Promise<{ category: DiscussionCategory; threads: DiscussionThread[] }> {
  const res = await fetch(`${API}/discussions/categories/${categoryId}/threads`);
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function createThread(categoryId: number, title: string, body: string): Promise<DiscussionThread> {
  const res = await fetch(`${API}/discussions/categories/${categoryId}/threads`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) throw new Error("Failed to create thread");
  return res.json();
}

export async function getThread(threadId: number): Promise<{ thread: DiscussionThread; posts: DiscussionPost[] }> {
  const res = await fetch(`${API}/discussions/threads/${threadId}`);
  if (!res.ok) throw new Error("Failed to fetch thread");
  return res.json();
}

export async function addPost(threadId: number, content: string): Promise<DiscussionPost> {
  const res = await fetch(`${API}/discussions/threads/${threadId}/posts`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add post");
  return res.json();
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(`${API}/discussions/posts/${postId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete post");
}

// --- Reading progress ---

export interface ReadingProgress {
  book_id: number;
  current_page: number;
  total_pages: number | null;
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const res = await fetch(`${API}/books/reading/progress`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function getReadingProgress(bookId: number): Promise<ReadingProgress> {
  const res = await fetch(`${API}/books/${bookId}/progress`, { headers: authHeaders() });
  if (!res.ok) return { book_id: bookId, current_page: 0, total_pages: null };
  return res.json();
}

export async function updateReadingProgress(bookId: number, current_page: number, total_pages?: number | null): Promise<ReadingProgress> {
  const res = await fetch(`${API}/books/${bookId}/progress`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ current_page, total_pages: total_pages ?? null }),
  });
  if (!res.ok) throw new Error("Failed to update progress");
  return res.json();
}

export async function getSurpriseBook(): Promise<Book> {
  const res = await fetch(`${API}/books/surprise`, { headers: authHeaders() });
  if (!res.ok) throw new Error("No surprise found");
  return pc(await res.json() as Book);
}

// --- Series progress ---

export interface SeriesProgress {
  series: string;
  total: number;
  read_count: number;
  books: { id: number; title: string; cover_url: string; series_order: number; is_read: number }[];
}

export async function getSeriesProgress(): Promise<SeriesProgress[]> {
  const res = await fetch(`${API}/books/series/progress`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json() as SeriesProgress[];
  return data.map(s => ({ ...s, books: s.books.map(b => ({ ...b, cover_url: proxyCover(b.cover_url) })) }));
}

// --- Challenges ---

export interface Challenge {
  id: number;
  user_id: number;
  type: string;
  target: number;
  year: number;
  progress: number;
  created_at: string;
}

export async function getChallenges(): Promise<Challenge[]> {
  const res = await fetch(`${API}/challenges`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function addChallenge(type: string, target: number): Promise<Challenge> {
  const res = await fetch(`${API}/challenges`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ type, target }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add challenge");
  }
  return res.json();
}

export async function deleteChallenge(id: number): Promise<void> {
  await fetch(`${API}/challenges/${id}`, { method: "DELETE", headers: authHeaders() });
}

// --- Search ---

export interface SearchAuthorResult {
  author: string;
  book_count: number;
  avg_rating: number;
}

export interface SearchListResult {
  id: number;
  title: string;
  description: string;
  user_id: number;
  username: string;
  item_count: number;
  like_count: number;
}

export interface SearchResults {
  books: Book[];
  authors: SearchAuthorResult[];
  lists: SearchListResult[];
}

export async function search(q: string, type?: string): Promise<SearchResults> {
  const params = new URLSearchParams({ q });
  if (type) params.set("type", type);
  const res = await fetch(`${API}/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
