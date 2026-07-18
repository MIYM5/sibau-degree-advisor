"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { programs } from "@/data/programs";
import { calculateOverallPercentage } from "@/lib/assessment-form";
import {
  ASSESSMENT_DRAFT_SESSION_KEY,
  RECOMMENDATION_SESSION_KEY,
  parseRecommendationSessionPayload,
  type RecommendationSessionPayload,
} from "@/lib/assessment-session";

import { SiteHeader } from "../site-header";
import { EligibilitySummary } from "./eligibility-summary";
import { InstitutionalFitWarning } from "./institutional-fit-warning";
import { RecommendationCard } from "./recommendation-card";

const programsById = new Map(programs.map((program) => [program.id, program]));

export function ResultsPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<
    RecommendationSessionPayload | null | undefined
  >(undefined);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPayload(
        parseRecommendationSessionPayload(
          window.sessionStorage.getItem(RECOMMENDATION_SESSION_KEY),
        ),
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function retakeAssessment() {
    window.sessionStorage.removeItem(ASSESSMENT_DRAFT_SESSION_KEY);
    window.sessionStorage.removeItem(RECOMMENDATION_SESSION_KEY);
    router.push("/assessment");
  }

  if (payload === undefined) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader compact />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="text-sm font-bold text-teal-700">Loading your results…</p>
        </div>
      </main>
    );
  }

  if (payload === null) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader compact />
        <section className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-100 text-2xl font-black text-teal-800">
            ?
          </span>
          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight">
            Complete the assessment first
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            We could not find valid recommendation results in this browser
            session. Complete or retake the assessment to generate them.
          </p>
          <Link href="/assessment" className="primary-button mt-8">
            Go to Assessment
          </Link>
        </section>
      </main>
    );
  }

  const studentProfile =
    payload.version === 1
      ? payload.studentProfile
      : payload.recommendationInput.academicProfile;
  const { recommendationResult } = payload;
  const componentWeights =
    payload.version === 2
      ? payload.recommendationResult.componentWeights
      : { academic: 0.5, interest: 0.3, aptitude: 0.2 };
  const overallPercentage = calculateOverallPercentage(
    studentProfile.subjectMarks,
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />

      <section className="border-b border-slate-200 bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">
              Your degree guidance
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              Recommendations for {studentProfile.name}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              These results combine your academic profile, interests, and
              aptitude after checking eligibility separately. They guide
              exploration and do not guarantee admission.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/assessment")}
              className="secondary-button border-slate-600 bg-slate-900 text-white hover:border-teal-400 hover:bg-slate-800"
            >
              Edit My Answers
            </button>
            <button
              type="button"
              onClick={retakeAssessment}
              className="primary-button"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-12 px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <section aria-labelledby="student-summary-heading">
          <h2 id="student-summary-heading" className="sr-only">
            Student summary
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Student
              </p>
              <p className="mt-2 text-lg font-bold">{studentProfile.name}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Intermediate group
              </p>
              <p className="mt-2 text-lg font-bold">
                {studentProfile.intermediateGroup}
              </p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Overall percentage
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-teal-950">
                {overallPercentage === null
                  ? "Not available"
                  : `${overallPercentage.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </section>

        <EligibilitySummary
          eligibleCount={recommendationResult.eligibleRecommendations.length}
          verificationCount={recommendationResult.verificationRequired.length}
          notEligibleCount={recommendationResult.notEligible.length}
        />

        <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
          Eligibility evidence can change between admission cycles. Always
          confirm requirements in the current Sukkur IBA admission advertisement
          before applying.
        </aside>

        <InstitutionalFitWarning
          warnings={recommendationResult.institutionalFitWarnings}
        />

        <section aria-labelledby="top-recommendations-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
              Ranked eligible programs
            </p>
            <h2
              id="top-recommendations-heading"
              className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Top recommendations
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              Up to five programs are ranked by suitability. Eligibility was
              checked before these scores were ordered.
            </p>
          </div>
          <div className="mt-7 space-y-5">
            {recommendationResult.topFiveEligibleRecommendations.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
                No program currently has an Eligible result. Review the
                verification-required section and confirm the current admission
                advertisement before making a decision.
              </div>
            )}
            {recommendationResult.topFiveEligibleRecommendations.map(
              (recommendation) => {
                const program = programsById.get(recommendation.programId);
                return program ? (
                  <RecommendationCard
                    key={recommendation.programId}
                    recommendation={recommendation}
                    program={program}
                    componentWeights={componentWeights}
                    interestLabel={
                      payload.version === 2 ? "RIASEC interests" : "Interests"
                    }
                    aptitudeLabel={
                      payload.version === 2
                        ? "Brief aptitude"
                        : "Aptitude"
                    }
                  />
                ) : null;
              },
            )}
          </div>
        </section>

        {recommendationResult.verificationRequired.length > 0 && (
          <section aria-labelledby="verification-heading">
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 sm:p-6">
              <h2
                id="verification-heading"
                className="font-serif text-2xl font-bold text-amber-950 sm:text-3xl"
              >
                Programs requiring current-advertisement verification
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-amber-900">
                These programs have suitability scores but no eligible rank.
                Their current admission evidence must be confirmed against the
                latest Sukkur IBA admission advertisement.
              </p>
            </div>
            <div className="mt-5 space-y-5">
              {recommendationResult.verificationRequired.map((recommendation) => {
                const program = programsById.get(recommendation.programId);
                return program ? (
                  <RecommendationCard
                    key={recommendation.programId}
                    recommendation={recommendation}
                    program={program}
                    variant="verification"
                    componentWeights={componentWeights}
                    interestLabel={
                      payload.version === 2 ? "RIASEC interests" : "Interests"
                    }
                    aptitudeLabel={
                      payload.version === 2
                        ? "Brief aptitude"
                        : "Aptitude"
                    }
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        {recommendationResult.notEligible.length > 0 && (
          <section aria-labelledby="not-eligible-heading">
            <h2
              id="not-eligible-heading"
              className="font-serif text-2xl font-bold sm:text-3xl"
            >
              Not eligible under the stored rules
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              These programs remain visible for transparency. They are not
              ranked, and their reasons explain which stored requirement was not
              met.
            </p>
            <div className="mt-5 space-y-3">
              {recommendationResult.notEligible.map((recommendation) => {
                const program = programsById.get(recommendation.programId);
                return (
                  <details
                    key={recommendation.programId}
                    className="group rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <summary className="cursor-pointer list-none px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600">
                      <span className="flex items-center justify-between gap-4">
                        <span>
                          <span className="font-bold text-slate-950">
                            {recommendation.programName}
                          </span>
                          <span className="ml-2 text-sm text-slate-500">
                            Not eligible · no rank
                          </span>
                        </span>
                        <span aria-hidden="true" className="text-lg group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <div className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">
                      <ul className="space-y-2">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                      {program && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p>{program.eligibilityNote}</p>
                          <a
                            href={program.officialSourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-lg font-bold text-teal-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                          >
                            Check official source
                          </a>
                          <p className="mt-2 text-xs text-slate-500">
                            Last verified: {program.lastVerified}
                          </p>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            How the model works
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
            Transparent methodology
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black">
                {componentWeights.academic * 100}%
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">Academic suitability</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black">
                {componentWeights.interest * 100}%
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">Interests</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black">
                {componentWeights.aptitude * 100}%
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {payload.version === 2
                  ? "Brief aptitude indication"
                  : "Aptitude self-assessment"}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Eligibility is checked separately and cannot be changed by a high
            suitability score. These weights are project assumptions, not
            official university admission weightages. SIBAU Degree Advisor is an
            independent project and does not make admission decisions.
          </p>
          {payload.version === 2 && (
            <p className="mt-3 text-sm font-medium leading-6 text-amber-800">
              {payload.recommendationResult.scoringModelVersion} · RIASEC
              evidence: {payload.recommendationResult.riasecEvidenceLabel} ·
              Aptitude evidence: {payload.recommendationResult.aptitudeEvidenceLabel}.
              The aptitude component is based on a brief five-task exercise and
              remains limited evidence.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
