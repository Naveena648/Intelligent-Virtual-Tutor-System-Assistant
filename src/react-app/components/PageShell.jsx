export default function PageShell({ eyebrow, title, description, children, actions }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
