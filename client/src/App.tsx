import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import ToRead from "./pages/ToRead";
import Diary from "./pages/Diary";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AuthorBooks from "./pages/AuthorBooks";
import ListsPage from "./pages/ListsPage";
import ListDetail from "./pages/ListDetail";
import CreateList from "./pages/CreateList";
import ActivityFeed from "./pages/ActivityFeed";
import UserProfile from "./pages/UserProfile";
import Stats from "./pages/Stats";
import TopRatedList from "./pages/TopRatedList";
import DiscussionBoard from "./pages/DiscussionBoard";
import ThreadList from "./pages/ThreadList";
import ThreadDetail from "./pages/ThreadDetail";
import NewThread from "./pages/NewThread";
import SearchPage from "./pages/Search";
import BrowsePage from "./pages/BrowsePage";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  // Close mobile nav on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    }
    if (navOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [navOpen]);

  // "/" keyboard shortcut to jump to search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate("/search");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const navLinks = (
    <>
      <Link
        to="/"
        onClick={() => setNavOpen(false)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Books
      </Link>
      <Link
        to="/search"
        onClick={() => setNavOpen(false)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Search
      </Link>
      {user && (
        <Link
          to="/to-read"
          onClick={() => setNavOpen(false)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Wishlist
        </Link>
      )}
      {user && (
        <Link
          to="/diary"
          onClick={() => setNavOpen(false)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Diary
        </Link>
      )}
      <Link
        to="/activity"
        onClick={() => setNavOpen(false)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Activity
      </Link>
      <Link
        to="/lists"
        onClick={() => setNavOpen(false)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Lists
      </Link>
      <Link
        to="/discuss"
        onClick={() => setNavOpen(false)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Discuss
      </Link>
    </>
  );

  return (
    <div className="min-h-screen transition-colors">
      <header className="bg-gray-950/90 backdrop-blur-sm border-b border-gray-800/60 sticky top-0 z-50" ref={navRef}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-serif font-bold text-blue-400">
            Overdue
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks}
            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 group">
                  <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-gray-700 group-hover:ring-blue-500 transition-all">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full bg-blue-700 flex items-center justify-center text-white text-[11px] font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-400 transition-colors"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-3">
            {!loading && user && (
              <Link to="/profile" className="flex items-center">
                <span className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-700">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full bg-blue-700 flex items-center justify-center text-white text-[11px] font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              </Link>
            )}
            <button
              onClick={() => setNavOpen((o) => !o)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {navOpen && (
          <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-3 flex flex-col gap-3">
            {navLinks}
            <div className="border-t border-gray-800 pt-3">
              {!loading && (user ? (
                <button
                  onClick={() => { logout(); setNavOpen(false); }}
                  className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" onClick={() => setNavOpen(false)} className="text-sm text-gray-400 hover:text-white transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register" onClick={() => setNavOpen(false)} className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-400 transition-colors">
                    Create account
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/browse/:sort" element={<BrowsePage />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/to-read" element={<ToRead />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/stats/:id" element={<Stats />} />
          <Route path="/author/:name" element={<AuthorBooks />} />
          <Route path="/activity" element={<ActivityFeed />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/new" element={<CreateList />} />
          <Route path="/lists/top-rated" element={<TopRatedList />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/discuss" element={<DiscussionBoard />} />
          <Route path="/discuss/categories/:id" element={<ThreadList />} />
          <Route path="/discuss/categories/:id/new" element={<NewThread />} />
          <Route path="/discuss/threads/:id" element={<ThreadDetail />} />
        </Routes>
      </main>
    </div>
  );
}
