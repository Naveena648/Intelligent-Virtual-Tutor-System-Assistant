import { Check, Copy, ThumbsDown, ThumbsUp, UserRound, WandSparkles } from "lucide-react";
import { useState } from "react";

export default function ChatBubble({ message, onFeedback }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-gradient-to-br from-blue-600 to-violet-600 text-white"}`}>
        {isUser ? <UserRound className="h-5 w-5" /> : <WandSparkles className="h-5 w-5" />}
      </div>

      <div className={`max-w-3xl space-y-3 ${isUser ? "items-end" : ""}`}>
        <div className={`rounded-3xl border px-4 py-4 shadow-sm ${isUser ? "border-blue-200 bg-blue-600 text-white dark:border-blue-900" : "border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"}`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7">{message.content}</pre>
        </div>

        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 hover:border-slate-300 dark:border-white/10">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button type="button" onClick={() => onFeedback?.("up", message)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 hover:border-slate-300 dark:border-white/10">
              <ThumbsUp className="h-3.5 w-3.5" />
              Helpful
            </button>
            <button type="button" onClick={() => onFeedback?.("down", message)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 hover:border-slate-300 dark:border-white/10">
              <ThumbsDown className="h-3.5 w-3.5" />
              Needs work
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
