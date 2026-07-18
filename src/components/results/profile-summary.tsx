import { calculateOverallPercentage } from "@/lib/assessment-form";
import type { ProfileMethodologyPresentation } from "@/lib/recommendation-presentation";

interface ProfileSummaryProps {
  summary: ProfileMethodologyPresentation;
}

function percentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ProfileSummary({ summary }: ProfileSummaryProps) {
  const overallPercentage = calculateOverallPercentage(
    summary.profile.subjectMarks,
  );
  const formulaItems = [
    {
      label: "Academic",
      value: summary.componentWeights.academic,
    },
    {
      label: summary.riasec ? "RIASEC interests" : "Interests",
      value: summary.componentWeights.interest,
    },
    {
      label: summary.aptitude ? "Brief aptitude" : "Aptitude",
      value: summary.componentWeights.aptitude,
    },
  ];

  return (
    <section aria-labelledby="profile-methodology-heading">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          Student evidence and model
        </p>
        <h2
          id="profile-methodology-heading"
          className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Student profile and methodology summary
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          This section shows the evidence and model labels used to produce the
          displayed guidance. Eligibility remains a separate decision.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Student
          </p>
          <p className="mt-2 text-lg font-bold">{summary.profile.name}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Intermediate group
          </p>
          <p className="mt-2 text-lg font-bold">
            {summary.profile.intermediateGroup}
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Overall percentage
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-teal-950">
            {overallPercentage === null
              ? "Not available"
              : percentage(overallPercentage)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Assessment mode
            </p>
            <h3 className="mt-1 text-2xl font-bold">{summary.assessmentLabel}</h3>
          </div>
          <code className="max-w-full break-all rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
            {summary.scoringModelVersion}
          </code>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {formulaItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black tabular-nums">
                {item.value * 100}%
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-800">
            Interest evidence: {summary.interestEvidenceLabel}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
            Aptitude evidence: {summary.aptitudeEvidenceLabel}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {summary.confidenceGuidance}
        </p>
      </div>

      {summary.riasec ? (
        <div className="mt-5 rounded-[1.5rem] border border-teal-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                RIASEC career-interest profile
              </p>
              <h3 className="mt-1 font-serif text-3xl font-bold">
                {summary.riasec.hollandCode}
              </h3>
              <p className="mt-2 font-bold text-slate-700">
                {summary.riasec.topThreeLabels.join(" · ")}
              </p>
            </div>
            <span className="w-fit rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
              {summary.riasec.evidenceLabel}
            </span>
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-600">
            {summary.riasec.explanation}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.riasec.scores.map((item) => (
              <div
                key={item.dimension}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-bold text-slate-700">
                  {item.label}
                </span>
                <span className="font-black tabular-nums text-slate-950">
                  {item.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            This project-designed activity is not the official O*NET Interest
            Profiler and is not a validated psychometric assessment.
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          This compatible Version 1 result uses the legacy custom interest and
          aptitude dimensions, so a Version 2 RIASEC profile is not available.
        </p>
      )}

      {summary.aptitude && (
        <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
                Brief aptitude summary
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                {summary.aptitude.totalCorrect} of {summary.aptitude.totalTasks}{" "}
                tasks correct
              </h3>
              <p className="mt-1 text-lg font-black tabular-nums text-slate-700">
                {percentage(summary.aptitude.overallPercentage)} overall
              </p>
            </div>
            <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {summary.aptitude.evidenceLabel} evidence
            </span>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.aptitude.taskOutcomes.map((task) => (
              <li
                key={task.taskId}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-bold text-slate-700">
                  {task.title}
                </span>
                <span
                  className={`text-xs font-black ${
                    task.outcome === "Correct"
                      ? "text-teal-700"
                      : "text-slate-600"
                  }`}
                >
                  {task.outcome}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            Five tasks do not provide a complete aptitude measurement. This is
            limited educational evidence, not a validated aptitude test or a
            guarantee of success.
          </p>
        </div>
      )}

      <p className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600">
        Eligibility and suitability are separate. Admission requirements must
        be verified against the current advertisement. Recommendations do not
        guarantee admission or career success.
      </p>
    </section>
  );
}
