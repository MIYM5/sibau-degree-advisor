import { calculateOverallPercentage } from "@/lib/assessment-form";
import {
  aptitudeDimensionLabels,
  aptitudeDimensionOrder,
} from "@/data/aptitude-questions";
import {
  interestDimensionLabels,
  interestDimensionOrder,
} from "@/data/interest-questions";
import { getInterestLevel } from "@/lib/interest-assessment";
import { getAptitudeLevel } from "@/lib/aptitude-assessment";
import { DETAILED_RIASEC_DISCLAIMER } from "@/lib/detailed-riasec-assessment";
import { QUICK_INTEREST_DISCLAIMER } from "@/lib/quick-interest-assessment";
import {
  riasecDimensionLabels,
  riasecDimensionOrder,
} from "@/types/riasec";
import type { AssessmentMode } from "@/types/assessment-mode";
import type { DetailedRiasecAssessmentResult } from "@/types/detailed-interest";
import type { QuickInterestAssessmentResult } from "@/types/quick-interest";
import type { StudentProfile } from "@/types/student";

interface ReviewStepProps {
  studentProfile: StudentProfile;
  assessmentMode?: AssessmentMode | "legacy";
  quickInterestResult?: QuickInterestAssessmentResult;
  detailedInterestResult?: DetailedRiasecAssessmentResult;
}

export function ReviewStep({
  studentProfile,
  assessmentMode,
  quickInterestResult,
  detailedInterestResult,
}: ReviewStepProps) {
  const overallPercentage = calculateOverallPercentage(
    studentProfile.subjectMarks,
  );
  const isQuickGuidance =
    assessmentMode === "quick" && Boolean(quickInterestResult?.profile);
  const isDetailedGuidance =
    assessmentMode === "detailed" && Boolean(detailedInterestResult?.profile);

  return (
    <section aria-labelledby="review-heading">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
        Step 5 of 5
      </p>
      <h1
        id="review-heading"
        className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
      >
        Review your assessment
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Check your academic information, interests, and aptitude self-assessment
        before generating your recommendations.
      </p>

      {(isQuickGuidance || isDetailedGuidance) && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-teal-950">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Assessment mode
          </p>
          <p className="mt-1 text-lg font-bold">
            {isQuickGuidance ? "Quick Guidance" : "Detailed Guidance"}
          </p>
          <p className="mt-2 text-sm leading-6 text-teal-800">
            RIASEC interests are shown for review only and are not yet used by
            recommendation scoring.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Student name
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {studentProfile.name}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Intermediate group
          </p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {studentProfile.intermediateGroup}
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Overall percentage
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-teal-950">
            {overallPercentage === null
              ? "Not available"
              : `${overallPercentage.toFixed(2)}%`}
          </p>
        </div>
      </div>

      {isQuickGuidance && quickInterestResult?.profile && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Preliminary RIASEC interest summary
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Five completed scenarios · Evidence label: Preliminary
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 px-4 py-3 text-white sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Profile code
                </p>
                <p className="mt-1 font-serif text-2xl font-bold tracking-[0.15em]">
                  {quickInterestResult.profile.hollandCode}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Top three: {quickInterestResult.profile.topThreeLabels.join(" · ")}
            </p>
          </div>

          <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
            {riasecDimensionOrder.map((dimension) => (
              <div
                key={dimension}
                className="flex items-center justify-between gap-4 bg-white px-5 py-4 sm:px-6"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {riasecDimensionLabels[dimension]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    RIASEC interest
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums text-slate-950">
                  {quickInterestResult.scores[dimension].toFixed(1)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">
            {QUICK_INTEREST_DISCLAIMER}
          </div>
        </div>
      )}

      {isDetailedGuidance && detailedInterestResult?.profile && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Detailed RIASEC interest summary
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {detailedInterestResult.evidenceCoverage.answeredQuestions} of{" "}
                  {detailedInterestResult.evidenceCoverage.totalQuestions} questions
                  answered · {detailedInterestResult.evidenceCoverage.percentageCoverage.toFixed(0)}%
                  coverage
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 px-4 py-3 text-white sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Profile code
                </p>
                <p className="mt-1 font-serif text-2xl font-bold tracking-[0.15em]">
                  {detailedInterestResult.profile.hollandCode}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Top three: {detailedInterestResult.profile.topThreeLabels.join(" · ")}
            </p>
            <p className="mt-2 text-sm font-semibold text-teal-800">
              Evidence label: {detailedInterestResult.evidenceLabel}
            </p>
          </div>

          <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
            {riasecDimensionOrder.map((dimension) => {
              const coverage =
                detailedInterestResult.evidenceCoverage.perDimension[dimension];
              return (
                <div
                  key={dimension}
                  className="flex items-center justify-between gap-4 bg-white px-5 py-4 sm:px-6"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {riasecDimensionLabels[dimension]}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {coverage.answeredQuestions} of {coverage.totalQuestions} answered
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-slate-950">
                    {detailedInterestResult.scores[dimension].toFixed(1)}
                  </p>
                </div>
              );
            })}
          </div>

          {detailedInterestResult.profileExplanation && (
            <div className="border-t border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-950 sm:px-6">
              <p className="font-bold">What this profile suggests</p>
              <p className="mt-1">{detailedInterestResult.profileExplanation}</p>
            </div>
          )}

          <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">
            {DETAILED_RIASEC_DISCLAIMER}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-950">Aptitude summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Each score is the average of three responses converted to a 0–100
            scale.
          </p>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {aptitudeDimensionOrder.map((dimension) => {
            const score = studentProfile.aptitudeScores[dimension];
            const level = score === undefined ? null : getAptitudeLevel(score);
            const levelStyles =
              level === "High"
                ? "bg-teal-100 text-teal-800"
                : level === "Moderate"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700";

            return (
              <div
                key={dimension}
                className="flex items-center justify-between gap-4 bg-white px-5 py-4 sm:px-6"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {aptitudeDimensionLabels[dimension]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Self-assessed aptitude
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-slate-950">
                    {score === undefined ? "—" : score.toFixed(1)}
                  </p>
                  {level && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${levelStyles}`}
                    >
                      {level}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 sm:px-6">
          This is a self-assessment for educational guidance, not a validated
          psychometric test.
        </div>
      </div>

      {assessmentMode !== "quick" && assessmentMode !== "detailed" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-950">Interest summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Each score is the average of two responses converted to a 0–100
            scale. These are self-reported interests, not ability scores.
          </p>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {interestDimensionOrder.map((dimension) => {
            const score = studentProfile.interestScores[dimension];
            const level = score === undefined ? null : getInterestLevel(score);
            const levelStyles =
              level === "High"
                ? "bg-teal-100 text-teal-800"
                : level === "Moderate"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700";

            return (
              <div
                key={dimension}
                className="flex items-center justify-between gap-4 bg-white px-5 py-4 sm:px-6"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {interestDimensionLabels[dimension]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Interest dimension</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-slate-950">
                    {score === undefined ? "—" : score.toFixed(1)}
                  </p>
                  {level && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${levelStyles}`}
                    >
                      {level}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-950">Subject summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Overall percentage uses total obtained marks divided by total possible
            marks.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {studentProfile.subjectMarks.map((mark) => (
            <div
              key={mark.subject}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8 sm:px-6"
            >
              <p className="font-semibold text-slate-900">{mark.subject}</p>
              <p className="text-sm tabular-nums text-slate-600">
                {mark.obtainedMarks} / {mark.totalMarks}
              </p>
              <p className="font-bold tabular-nums text-slate-950 sm:min-w-20 sm:text-right">
                {mark.calculatedPercentage.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-bold text-amber-950">
          Your information stays in this browser-tab session
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          This MVP temporarily uses session storage so you can view results and
          edit your answers. It does not save them to a database or long-term
          browser storage.
        </p>
      </div>
    </section>
  );
}
