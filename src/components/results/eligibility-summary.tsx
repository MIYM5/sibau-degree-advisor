interface EligibilitySummaryProps {
  eligibleCount: number;
  verificationCount: number;
  notEligibleCount: number;
}

export function EligibilitySummary({
  eligibleCount,
  verificationCount,
  notEligibleCount,
}: EligibilitySummaryProps) {
  const items = [
    {
      label: "Eligible",
      count: eligibleCount,
      styles: "border-teal-200 bg-teal-50 text-teal-950",
      countStyles: "bg-teal-700 text-white",
    },
    {
      label: "Verification required",
      count: verificationCount,
      styles: "border-amber-200 bg-amber-50 text-amber-950",
      countStyles: "bg-amber-600 text-white",
    },
    {
      label: "Not eligible",
      count: notEligibleCount,
      styles: "border-slate-200 bg-slate-50 text-slate-900",
      countStyles: "bg-slate-700 text-white",
    },
  ] as const;

  return (
    <section aria-labelledby="eligibility-summary-heading">
      <h2 id="eligibility-summary-heading" className="sr-only">
        Eligibility summary
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between rounded-2xl border p-4 ${item.styles}`}
          >
            <span className="text-sm font-bold">{item.label}</span>
            <span
              className={`grid size-9 place-items-center rounded-full text-sm font-black ${item.countStyles}`}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
