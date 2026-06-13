import { ArrowRight, CheckCircle2, Lightbulb, MessageSquareWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageShell from "../components/PageShell.jsx";
import { request } from "../lib/api.js";

const fallbackConcepts = [
  {
    title: "Recursion in programming",
    domain: "Programming",
    question: "What is recursion?",
    answer:
      "Recursion is when a function calls itself with a smaller version of the same problem until it reaches a base case.",
  },
  {
    title: "Compound interest",
    domain: "Finance",
    question: "How does compound interest work?",
    answer:
      "Compound interest grows because interest is added to the principal, and future interest is then calculated on the new total balance.",
  },
  {
    title: "Civil and criminal law",
    domain: "Law",
    question: "What is the difference between civil and criminal law?",
    answer:
      "Civil law handles disputes between people or organizations, while criminal law deals with offenses against public law.",
  },
];

export default function ExplainPage() {
  const [concept, setConcept] = useState(fallbackConcepts[0]);
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("lumina-last-tutor-answer");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setConcept({
        title: parsed.domain,
        domain: parsed.domain,
        question: parsed.question,
        answer: parsed.answer,
      });
    } catch {
      // ignore malformed local state
    }
  }, []);

  async function evaluate() {
    if (!explanation.trim()) return;

    try {
      setStatus("Evaluating the explanation against the reference answer...");
      const response = await request("/api/evaluate", {
        method: "POST",
        body: JSON.stringify({
          question: concept.question,
          referenceAnswer: concept.answer,
          explanation,
          domain: concept.domain,
        }),
      });

      setResult(response);
      setStatus("Evaluation complete.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Explain-It-Back mode"
      title="Check understanding, not just recall"
      description="The system compares the learner's explanation with the reference answer, classifies understanding, and suggests what to improve next."
      actions={
        <Link to="/chat" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Back to chat
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Concept</p>
          <h2 className="mt-3 text-2xl font-semibold">{concept.title}</h2>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">{concept.domain}</p>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">{concept.question}</p>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reference answer</p>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{concept.answer}</p>
          </div>

          <div className="mt-6 space-y-3">
            {fallbackConcepts.map((item) => (
              <button key={item.title} type="button" onClick={() => { setConcept(item); setResult(null); setExplanation(""); }} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300 dark:border-white/10 dark:bg-slate-900">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.domain}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your explanation</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Write the concept in your own words.</p>
            </div>
          </div>

          <textarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            rows={8}
            placeholder="Explain it back here..."
            className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-slate-950 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          />

          <button type="button" onClick={evaluate} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
            Evaluate explanation
            <CheckCircle2 className="h-4 w-4" />
          </button>

          {status ? <p className="text-sm text-slate-500 dark:text-slate-400">{status}</p> : null}

          {result ? (
            <div className={`rounded-[1.5rem] border p-5 ${result.status === "correct" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : result.status === "partial" ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10" : "border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10"}`}>
              <div className="flex items-center gap-3">
                <MessageSquareWarning className="h-5 w-5" />
                <p className="font-semibold">
                  {result.status === "correct" ? "Correct understanding" : result.status === "partial" ? "Partial understanding" : "Incorrect understanding"}
                </p>
                <p className="ml-auto text-sm font-medium">Score: {result.score}%</p>
              </div>
              <p className="mt-3 text-sm leading-7">{result.feedback}</p>
              <div className="mt-4 space-y-2 text-sm">
                {result.suggestions.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/70 px-4 py-3 dark:bg-black/20">{item}</div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
