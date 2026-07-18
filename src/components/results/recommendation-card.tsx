import type { DegreeProgram } from "@/types/program";
import type { RecommendationResult } from "@/types/recommendation";
import type { RecommendationComponentWeights } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: RecommendationResult;
  program: DegreeProgram;
  variant?: "ranked" | "verification";
  componentWeights?: RecommendationComponentWeights;
  interestLabel?: string;
  aptitudeLabel?: string;
}

function score(value: number): string {
  return value.toFixed(1);
}

export function RecommendationCard({
  recommendation,
  program,
  variant = "ranked",
  componentWeights = { academic: 0.5, interest: 0.3, aptitude: 0.2 },
  interestLabel = "Interests",
  aptitudeLabel = "Aptitude",
}: RecommendationCardProps) {
  const isRanked = recommendation.eligibilityStatus === "Eligible";
  const scoreItems = [
    {
      label: "Academic",
      value: recommendation.academicScore,
      weight: `${componentWeights.academic * 100}%`,
    },
    {
      label: interestLabel,
      value: recommendation.interestScore,
      weight: `${componentWeights.interest * 100}%`,
    },
    {
      label: aptitudeLabel,
      value: recommendation.aptitudeScore,
      weight: `${componentWeights.aptitude * 100}%`,
    },
  ];

  return (
    <article
      className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-sm ${
        variant === "ranked" ? "border-slate-200" : "border-amber-200"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {isRanked ? (
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 font-serif text-xl font-bold text-white">
                {recommendation.rank}
              </span>
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-lg font-black text-amber-800">
                ?
              </span>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                {program.category} · {program.duration}
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {recommendation.programName}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                  {recommendation.recommendationBand}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {recommendation.confidence} confidence
                </span>
                {!isRanked && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Verification required
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-slate-950 px-5 py-4 text-white sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Suitability score
            </p>
            <p className="mt-1 text-3xl font-black tabular-nums">
              {score(recommendation.finalScore)}
            </p>
            <p className="text-xs text-slate-400">out of 100</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {scoreItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                <span>{item.label}</span>
                <span>{item.weight}</span>
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-950">
                {score(item.value)}
              </p>
            </div>
          ))}
        </div>

        {recommendation.reasons[0] && (
          <p className="mt-5 text-sm leading-6 text-slate-600">
            {recommendation.reasons[0]}
          </p>
        )}
      </div>

      <details className="group border-t border-slate-200 bg-slate-50/70">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-slate-800 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 sm:px-6">
          <span className="flex items-center justify-between gap-4">
            View reasons, improvement areas, and careers
            <span aria-hidden="true" className="text-lg transition group-open:rotate-45">
              +
            </span>
          </span>
        </summary>
        <div className="grid gap-6 border-t border-slate-200 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <div>
            <h4 className="font-bold text-slate-950">Why this result appeared</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {recommendation.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden="true" className="text-teal-700">
                    •
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-950">Improvement areas</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {recommendation.improvementAreas.length > 0 ? (
                recommendation.improvementAreas.map((area) => (
                  <li key={area} className="flex gap-2">
                    <span aria-hidden="true" className="text-amber-700">
                      •
                    </span>
                    <span>{area}</span>
                  </li>
                ))
              ) : (
                <li>No specific improvement area was identified.</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-950">Possible career directions</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {program.careerOptions.join(", ")}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-950">Eligibility evidence</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {program.eligibilityNote}
            </p>
            <a
              href={program.officialSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg text-sm font-bold text-teal-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Check official source
            </a>
            <p className="mt-2 text-xs text-slate-500">
              Last verified: {program.lastVerified}
            </p>
          </div>
        </div>
      </details>
    </article>
  );
}
