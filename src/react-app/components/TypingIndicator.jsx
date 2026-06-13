export default function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
      <span className="flex h-2.5 w-2.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.2s]" />
      <span className="flex h-2.5 w-2.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.1s]" />
      <span className="flex h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-500" />
      <span>Thinking...</span>
    </div>
  );
}
