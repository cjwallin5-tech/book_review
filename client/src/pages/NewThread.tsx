import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createThread } from "../api";
import { useAuth } from "../context/AuthContext";

export default function NewThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link> to create a thread.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !title.trim()) return;
    setSubmitting(true);
    try {
      const thread = await createThread(Number(id), title.trim(), body.trim());
      navigate(`/discuss/threads/${thread.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        to={`/discuss/categories/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-5 mb-6">New Thread</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What's on your mind?"
            className="block w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Body <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            placeholder="Add more context, a question, or a quote…"
            className="block w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Creating…" : "Create Thread"}
          </button>
          <Link
            to={`/discuss/categories/${id}`}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
