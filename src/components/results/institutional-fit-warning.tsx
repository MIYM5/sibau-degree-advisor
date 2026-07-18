import type { InstitutionalFitWarning as InstitutionalFitWarningData } from "@/lib/recommendation-engine";

interface InstitutionalFitWarningProps {
  warnings: readonly InstitutionalFitWarningData[];
}

export function InstitutionalFitWarning({
  warnings,
}: InstitutionalFitWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <aside
      className="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-5 shadow-sm sm:p-6"
      aria-labelledby="institutional-fit-heading"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
        Important context
      </p>
      <h2
        id="institutional-fit-heading"
        className="mt-2 text-xl font-bold text-amber-950"
      >
        Consider your fit with the available SIBAU programs
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
        {warnings.map((warning) => (
          <li key={warning.code} className="flex gap-3">
            <span aria-hidden="true" className="font-black">
              !
            </span>
            <span>{warning.message}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
