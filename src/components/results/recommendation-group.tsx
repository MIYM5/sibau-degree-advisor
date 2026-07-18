import type { ReactNode } from "react";

interface RecommendationGroupProps {
  headingId: string;
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  emptyMessage?: string;
  children?: ReactNode;
}

export function RecommendationGroup({
  headingId,
  eyebrow,
  title,
  description,
  note,
  emptyMessage,
  children,
}: RecommendationGroupProps) {
  return (
    <section aria-labelledby={headingId}>
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          {eyebrow}
        </p>
        <h2
          id={headingId}
          className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
        {note && (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
            {note}
          </p>
        )}
      </div>
      {children ? (
        <div className="mt-7 space-y-5">{children}</div>
      ) : (
        emptyMessage && (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
            {emptyMessage}
          </p>
        )
      )}
    </section>
  );
}
