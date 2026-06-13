import { Filter, Plus, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageShell from "../components/PageShell.jsx";
import { request } from "../lib/api.js";

const statusConfig = {
  open: { label: "Open", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  in_progress: { label: "In Progress", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  resolved: { label: "Resolved", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

export default function TicketsPage({ user }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", domain: "Programming" });
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    request("/api/tickets")
      .then((data) => setTickets(data.tickets))
      .catch((error) => setStatus(error.message));
  }, [user]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => filter === "all" || ticket.status === filter), [tickets, filter]);

  async function createTicket() {
    try {
      setStatus("");
      const response = await request("/api/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTickets((current) => [response.ticket, ...current]);
      setForm({ title: "", description: "", domain: "Programming" });
      setStatus(`Created ${response.ticket.id}`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Query management"
      title="Ticket dashboard"
      description="Raise a ticket when the tutor response is not enough, then track the resolution status or let an admin take over."
      actions={
        <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Open chat
        </Link>
      }
    >
      {!user ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-950/70">
          <p className="text-lg font-semibold">Sign in to create and manage tickets.</p>
          <Link to="/auth" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            Go to auth
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Create ticket</p>
            <div className="mt-4 space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900" />
              <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900">
                {['Education', 'Programming', 'Healthcare', 'Law', 'Finance', 'Personal Development'].map((domain) => <option key={domain}>{domain}</option>)}
              </select>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Describe the issue in detail" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900" />
              <button type="button" onClick={createTicket} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                Create ticket
              </button>
              {status ? <p className="text-sm text-slate-500 dark:text-slate-400">{status}</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your tickets</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                <Filter className="h-4 w-4" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent outline-none">
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                        <p className="font-semibold">{ticket.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.id} · {ticket.domain}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig[ticket.status].tone}`}>{statusConfig[ticket.status].label}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{ticket.description}</p>
                </div>
              ))}
              {!filteredTickets.length ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                  No tickets match this filter yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
