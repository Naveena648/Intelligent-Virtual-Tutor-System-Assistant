import { BarChart3, LockKeyhole, RefreshCw, TicketCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageShell from "../components/PageShell.jsx";
import { request } from "../lib/api.js";

export default function AdminPage({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;

    request("/api/admin/analytics")
      .then(setAnalytics)
      .catch((error) => setStatus(error.message));
  }, [user]);

  return (
    <PageShell
      eyebrow="Operations"
      title="Admin panel"
      description="Monitor usage, ticket resolution, and feedback volume. Admin access is required for analytics and ticket status changes."
      actions={
        <Link to="/tickets" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          <TicketCheck className="h-4 w-4" />
          Tickets
        </Link>
      }
    >
      {!user ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-950/70">
          <LockKeyhole className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-4 text-lg font-semibold">Sign in as an admin to view analytics.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The seeded admin account is admin@lumina.local with password Admin123! unless overridden by `ADMIN_PASSWORD`.</p>
          <Link to="/auth" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            Go to auth
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {[
            ["Users", analytics?.users ?? "-"],
            ["Tickets", analytics?.tickets ?? "-"],
            ["Conversations", analytics?.conversations ?? "-"],
            ["Feedback", analytics?.feedbackCount ?? "-"] ,
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}

          <div className="md:col-span-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <p className="font-semibold">Ticket breakdown</p>
              </div>
              <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {analytics ? (
                Object.entries(analytics.ticketCounts).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{key.replace("_", " ")}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{status || "Loading analytics..."}</p>
              )}
            </div>
          </div>

          {status ? <p className="md:col-span-4 text-sm text-slate-500 dark:text-slate-400">{status}</p> : null}
        </div>
      )}
    </PageShell>
  );
}
