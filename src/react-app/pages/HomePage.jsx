import { ArrowRight, BadgeCheck, BrainCircuit, Database, Sparkles, Ticket, WandSparkles } from "lucide-react";
import { Link } from "react-router";
import PageShell from "../components/PageShell.jsx";

const domains = [
  ["Education", "from-blue-500 to-cyan-500"],
  ["Programming", "from-violet-500 to-fuchsia-500"],
  ["Healthcare", "from-emerald-500 to-teal-500"],
  ["Law", "from-amber-500 to-orange-500"],
  ["Finance", "from-sky-500 to-indigo-500"],
  ["Personal Development", "from-slate-600 to-slate-900"],
];

const features = [
  { icon: BrainCircuit, title: "RAG tutor chat", copy: "Retrieves relevant chunks before answering so the model stays grounded in source material." },
  { icon: WandSparkles, title: "Explain-It-Back", copy: "After each answer, the learner explains the idea back and receives structured feedback." },
  { icon: Database, title: "Semantic search", copy: "Text similarity helps route the question to the right knowledge base before generation." },
  { icon: Ticket, title: "Ticket workflow", copy: "Users can create tickets, track status, and let admins resolve open issues." },
];

export default function HomePage({ user }) {
  return (
    <PageShell
      eyebrow="AI tutoring platform"
      title="Intelligent Virtual Tutor System Assistant"
      description="A full-stack tutoring workspace for accurate answers, semantic retrieval, explain-it-back review, and ticket management across multiple domains."
      actions={
        <>
          <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            Start tutoring
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
            <BadgeCheck className="h-4 w-4" />
            {user ? "Account ready" : "Sign in"}
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            Built for grounded answers
          </div>
          <h2 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight">Reduce hallucinations with retrieval-first responses.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
            The system classifies your question, searches domain knowledge, produces a structured answer, and then asks you to explain the concept back.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["RAG pipeline", "Search before generation"],
              ["Explain-It-Back", "Active learning loop"],
              ["Ticketing", "Escalate unanswered issues"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {features.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {domains.map(([name, tone]) => (
          <div key={name} className="rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <div className={`mb-3 h-2 rounded-full bg-gradient-to-r ${tone}`} />
            <p className="font-semibold">{name}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Domain-aware routing and retrieval support.</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
