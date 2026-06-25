import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Lock, Globe } from "lucide-react";
import { createList } from "../api";

const TITLE_MAX = 80;
const DESC_MAX = 300;

export default function CreateList() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const list = await createList(title.trim(), description.trim(), isPrivate);
      navigate(`/lists/${list.id}`);
    } catch {
      setError("Failed to create list. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        to="/lists"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to lists
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-5 mb-1">New List</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-7">
        Organise books into a shareable collection.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-300">Title</label>
            <span className={`text-xs tabular-nums ${title.length > TITLE_MAX * 0.9 ? "text-amber-400" : "text-gray-500"}`}>
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            required
            placeholder="e.g. Books I read in 2025"
            className="block w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-300">
              Description <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <span className={`text-xs tabular-nums ${description.length > DESC_MAX * 0.9 ? "text-amber-400" : "text-gray-500"}`}>
              {description.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
            rows={4}
            placeholder="What's this list about?"
            className="block w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
          />
        </div>

        {/* Visibility toggle */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Visibility</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                !isPrivate
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <Globe size={15} />
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                isPrivate
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <Lock size={15} />
              Private
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isPrivate ? "Only you can see this list." : "Anyone can view and like this list."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating…" : "Create List"}
          </button>
          <Link
            to="/lists"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
