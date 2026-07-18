import Link from "next/link";

interface SiteHeaderProps {
  compact?: boolean;
}

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-4"
          aria-label="SIBAU Degree Advisor home"
        >
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold tracking-tight text-white shadow-sm transition group-hover:bg-teal-700"
          >
            DA
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-950 sm:text-base">
              SIBAU Degree Advisor
            </span>
            {!compact && (
              <span className="hidden text-xs text-slate-500 sm:block">
                Independent student guidance
              </span>
            )}
          </span>
        </Link>

        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
          MVP assessment
        </span>
      </div>
    </header>
  );
}
