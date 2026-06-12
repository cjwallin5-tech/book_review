import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Star, Bookmark, Trophy, Hash } from "lucide-react";
import type { DiscussionCategory } from "../api";
import { getDiscussionCategories } from "../api";

const CATEGORY_STYLES = [
  { gradient: "from-blue-600 to-teal-500", Icon: MessageSquare },
  { gradient: "from-amber-500 to-orange-500", Icon: Star },
  { gradient: "from-sky-600 to-blue-500", Icon: Bookmark },
  { gradient: "from-violet-600 to-purple-500", Icon: Trophy },
];

function getCategoryStyle(position: number) {
  return CATEGORY_STYLES[(position - 1) % CATEGORY_STYLES.length];
}

export default function DiscussionBoard() {
  const [categories, setCategories] = useState<DiscussionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDiscussionCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Hash size={18} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discussions</h1>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 ml-7">
          Join the conversation about books, reading, and more
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-5 rounded-xl bg-gray-800">
              <div className="w-12 h-12 rounded-lg bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-10 text-center">No categories yet.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const { gradient, Icon } = getCategoryStyle(cat.position);
            return (
              <Link
                key={cat.id}
                to={`/discuss/categories/${cat.id}`}
                className="group flex items-center gap-4 p-5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700/50 hover:border-gray-600 transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-gray-100 group-hover:text-white transition-colors">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5 bg-gray-700 px-2.5 py-1 rounded-full">
                  <MessageSquare size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-300 tabular-nums">
                    {cat.thread_count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
