import { ArrowRight, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import ChatBubble from "../components/ChatBubble.jsx";
import PageShell from "../components/PageShell.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import { request } from "../lib/api.js";

const domains = ["Auto", "Education", "Programming", "Healthcare", "Law", "Finance", "Personal Development"];
const languages = ["en", "es", "fr", "hi"];

const starterPrompts = [
  "Explain compound interest in simple terms.",
  "How does async/await work in JavaScript?",
  "Give me a safe general explanation of common vitamin D questions.",
  "What is the difference between civil and criminal law?",
];

export default function ChatPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ask a question and I will retrieve relevant context before answering. I will also ask you to explain the idea back after each response.",
    },
  ]);
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState("Auto");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const reopenConversation = location.state?.reopenConversation;
    if (!reopenConversation) {
      return;
    }

    setMessages([
      {
        role: "assistant",
        content: "Loaded from your history. You can continue this topic or ask a new one.",
      },
      { role: "user", content: reopenConversation.question },
      { role: "assistant", content: reopenConversation.answer },
    ]);
    setDomain(reopenConversation.domain || "Auto");
    setStatus("Reopened a past conversation from your account history.");

    navigate("/chat", { replace: true, state: null });
  }, [location.state, navigate]);

  const canUseSpeech = useMemo(() => typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window), []);

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setStatus("Retrieving relevant context...");

    try {
      const response = await request("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          domain,
          language,
          userId: user?.id,
          conversationHistory: nextMessages.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const assistantMessage = {
        role: "assistant",
        content: response.answer,
      };

      setMessages([...nextMessages, assistantMessage]);
      setStatus(`Domain routed to ${response.domain} with ${(response.classification.confidence * 100).toFixed(0)}% confidence.`);

      localStorage.setItem(
        "lumina-last-tutor-answer",
        JSON.stringify({
          question: trimmed,
          answer: response.answer,
          domain: response.domain,
          language,
          sources: response.sources,
        }),
      );

      if (voiceEnabled && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(response.answer.replace(/\n+/g, " "));
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: `I could not answer that right now: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleFeedback(type, message) {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message: message.content, domain, userId: user?.id || null }),
    }).catch(() => {});
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setStatus("Voice input captured.");
    };
    recognition.onerror = () => setStatus("Voice input failed. Try again.");
    recognition.start();
  }

  return (
    <PageShell
      eyebrow="AI virtual tutor"
      title="Chat with the system"
      description="Ask a natural language question, retrieve the relevant knowledge, and keep the response grounded in the right domain."
      actions={
        <Link to="/explain" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
          <Sparkles className="h-4 w-4" />
          Continue to Explain-It-Back
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Controls</p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-medium">
              Domain
              <select value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900">
                {domains.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Language
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900">
                {languages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setVoiceEnabled((value) => !value)}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left dark:border-white/10 dark:bg-slate-900"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                {voiceEnabled ? <Mic className="h-4 w-4 text-blue-600" /> : <MicOff className="h-4 w-4" />}
                Voice output
              </span>
              <span className="text-xs text-slate-500">{voiceEnabled ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={!canUseSpeech}
              className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-left text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <Mic className="h-4 w-4" />
                Voice input
              </span>
              <span className="text-xs text-white/70">{canUseSpeech ? "Ready" : "Unavailable"}</span>
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Starter prompts</p>
            <div className="mt-3 space-y-2">
              {starterPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setInput(prompt)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10">
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {user ? (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Signed in as {user.name}. Chat history and ticket links will be tied to your account.
            </div>
          ) : (
            <Link to="/auth" className="mt-6 block rounded-[1.5rem] border border-slate-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-white/10 dark:bg-blue-500/10 dark:text-blue-200">
              Sign in to persist your history, feedback, and ticket activity.
            </Link>
          )}
        </aside>

        <section className="flex min-h-[72vh] flex-col rounded-[2rem] border border-white/70 bg-white/85 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex-1 space-y-5 overflow-auto p-6">
            {messages.map((message, index) => (
              <ChatBubble key={`${index}-${message.role}`} message={message} onFeedback={handleFeedback} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-white/10">
            {status ? <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{status}</p> : null}
            <div className="flex items-end gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask a question in natural language..."
                className="min-h-[56px] flex-1 resize-none bg-transparent px-2 py-3 text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Send
                <Send className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Link to="/tickets" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 dark:border-white/10">
                Open a ticket
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/explain" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 dark:border-white/10">
                Explain it back
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
