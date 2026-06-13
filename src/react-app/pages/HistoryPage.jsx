import { Clock3, MessageSquareText, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import PageShell from "../components/PageShell.jsx";
import { request } from "../lib/api.js";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

export default function HistoryPage({ user }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setStatus("");

      try {
        const response = await request("/api/chat/history?limit=100");
        if (!cancelled) {
          setHistory(Array.isArray(response.conversations) ? response.conversations : []);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message || "Failed to load chat history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function reopenConversation(entry) {
    navigate("/chat", {
      state: {
        reopenConversation: {
          id: entry.id,
          question: entry.question,
          answer: entry.answer,
          domain: entry.domain,
          createdAt: entry.createdAt,
        },
      },
    });
  }

  return (
    <PageShell
      eyebrow="Conversation archive"
      title="Chat history"
      description="See your account-specific past questions and reopen any conversation instantly in Tutor Chat."
      actions={
        <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Back to chat
        </Link>
      }
    >
      {!user ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-950/70">
          <p className="text-lg font-semibold">Sign in to access your chat history.</p>
          <Link to="/auth" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            Go to auth
          </Link>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          {status ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-300">{status}</p> : null}
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading history...</p> : null}

          {!loading && history.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
              No conversation history found for this account yet.
            </div>
          ) : null}

          <div className="grid gap-4">
            {history.map((entry) => (
              <article key={entry.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      {entry.domain || "General"}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{entry.question}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => reopenConversation(entry)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen in chat
                  </button>
                </div>

                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.answer}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDate(entry.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
