"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { programs } from "@/data/programs";
import {
  buildProfileMethodologyPresentation,
  buildRecommendationPresentation,
  SCORE_DIFFERENCE_GUIDANCE,
} from "@/lib/recommendation-presentation";
import {
  ASSESSMENT_DRAFT_SESSION_KEY,
  RECOMMENDATION_SESSION_KEY,
  parseRecommendationSessionPayload,
  type RecommendationSessionPayload,
} from "@/lib/assessment-session";
import { ASSESSMENT_FEEDBACK_SESSION_KEY } from "@/lib/assessment-feedback";
import type { AssessmentFeedbackPlacement } from "@/types/assessment-feedback";
import type { ProgramId } from "@/types/program";
import type {
  PresentedEligibleRecommendation,
  RecommendationResult,
} from "@/types/recommendation";

import { SiteHeader } from "../site-header";
import { AssessmentFeedbackForm } from "./assessment-feedback";
import { EligibilitySummary } from "./eligibility-summary";
import { InstitutionalFitWarning } from "./institutional-fit-warning";
import { ProfileSummary } from "./profile-summary";
import { RecommendationCard } from "./recommendation-card";
import { RecommendationGroup } from "./recommendation-group";

const programsById = new Map(programs.map((program) => [program.id, program]));

function InvalidResultsState() {
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
    window.sessionStorage.removeItem(ASSESSMENT_FEEDBACK_SESSION_KEY);
    router.push("/assessment");
  }

  if (payload === undefined) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <SiteHeader compact />
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="text-sm font-bold text-teal-700">
            Loading your results…
          </p>
        </div>
      </main>
    );
  }

  if (payload === null) return <InvalidResultsState />;

  const presentation = buildRecommendationPresentation(
    payload.recommendationResult,
  );
  const profileSummary = buildProfileMethodologyPresentation(payload);
  if (!presentation || !profileSummary) return <InvalidResultsState />;

  const { componentWeights } = profileSummary;
  const interestLabel = payload.version === 2 ? "RIASEC interests" : "Interests";
  const aptitudeLabel = payload.version === 2 ? "Brief aptitude" : "Aptitude";

  function confidenceContext(recommendation: RecommendationResult): string | undefined {
    if (payload?.version !== 2) return undefined;
    if (payload.recommendationInput.assessmentMode === "quick") {
      return "Quick Guidance uses preliminary interest evidence and limited five-task aptitude evidence, so confidence never exceeds Medium.";
    }
    if (recommendation.confidence === "High") {
      return (
        recommendation.confidenceNotes?.[0] ??
        "The aptitude component is based on a brief five-task exercise and remains limited evidence."
      );
    }
    return "Detailed Guidance uses stronger interest evidence, while the five-task aptitude component remains limited evidence.";
  }

  function recommendationCard(
    item: PresentedEligibleRecommendation,
  ) {
    const program = programsById.get(item.recommendation.programId);
    return program ? (
      <RecommendationCard
        key={item.recommendation.programId}
        recommendation={item.recommendation}
        program={program}
        componentWeights={componentWeights}
        interestLabel={interestLabel}
        aptitudeLabel={aptitudeLabel}
        comparisonWithPrevious={item.comparisonWithPrevious}
        confidenceContext={confidenceContext(item.recommendation)}
      />
    ) : null;
  }

  const alternativeNote =
    presentation.additionalEligibleCount > 0
      ? `${presentation.additionalEligibleCount} additional eligible program${presentation.additionalEligibleCount === 1 ? " is" : "s are"} outside this five-program shortlist.`
      : presentation.alternativeOptions.length < 2
        ? "Fewer than five eligible programs are available, so no empty alternative cards are shown."
        : undefined;

  const feedbackPlacements: Partial<
    Record<ProgramId, AssessmentFeedbackPlacement>
  > = Object.fromEntries(
    programs.map((program) => [program.id, "not_recommended"]),
  );
  for (const item of presentation.topMatches) {
    feedbackPlacements[item.recommendation.programId] = "top_three";
  }
  for (const item of presentation.alternativeOptions) {
    feedbackPlacements[item.recommendation.programId] = "alternative_options";
  }
  for (const item of presentation.verificationRequired) {
    feedbackPlacements[item.programId] = "verification_required";
  }
  for (const item of presentation.notEligible) {
    feedbackPlacements[item.programId] = "not_eligible";
  }

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
              Recommendations for {profileSummary.profile.name}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Eligibility was checked separately before eligible programs were
              ranked by suitability. These recommendations guide exploration
              and do not guarantee admission or career success.
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

      <div className="mx-auto w-full max-w-7xl space-y-14 px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <EligibilitySummary
          eligibleCount={presentation.totalEligibleCount}
          verificationCount={presentation.verificationRequired.length}
          notEligibleCount={presentation.notEligible.length}
        />

        <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
          Eligibility and suitability are separate. Admission evidence can
          change annually, so confirm every requirement in the current Sukkur
          IBA admission advertisement before applying.
        </aside>

        <InstitutionalFitWarning
          warnings={presentation.institutionalFitWarnings}
        />

        <RecommendationGroup
          headingId="top-matches-heading"
          eyebrow="Ranks 1–3 · eligible programs"
          title="Top Matches"
          description="These are the first three eligible programs in the engine's existing deterministic ranking. Their scores were not recalculated for this display."
          note={SCORE_DIFFERENCE_GUIDANCE}
          emptyMessage="No program currently has an Eligible result. Review the verification section and confirm the current admission advertisement before interpreting suitability."
        >
          {presentation.topMatches.length > 0
            ? presentation.topMatches.map(recommendationCard)
            : undefined}
        </RecommendationGroup>

        <RecommendationGroup
          headingId="alternative-options-heading"
          eyebrow="Ranks 4–5 · eligible programs"
          title="Alternative Options"
          description="These eligible programs remain useful options in the five-program shortlist, especially when score differences are small or preparation goals differ."
          note={alternativeNote}
          emptyMessage="There are no eligible programs ranked fourth or fifth. No placeholder cards are shown."
        >
          {presentation.alternativeOptions.length > 0
            ? presentation.alternativeOptions.map(recommendationCard)
            : undefined}
        </RecommendationGroup>

        <RecommendationGroup
          headingId="verification-heading"
          eyebrow="Unranked · current evidence check needed"
          title="Programs requiring admission verification"
          description="These programs retain their suitability scores but receive no rank. Their admission evidence must be checked against the current advertisement."
          emptyMessage="No program currently falls into the Verification required classification."
        >
          {presentation.verificationRequired.length > 0
            ? presentation.verificationRequired.map((recommendation) => {
                const program = programsById.get(recommendation.programId);
                return program ? (
                  <RecommendationCard
                    key={recommendation.programId}
                    recommendation={recommendation}
                    program={program}
                    variant="verification"
                    componentWeights={componentWeights}
                    interestLabel={interestLabel}
                    aptitudeLabel={aptitudeLabel}
                    confidenceContext={confidenceContext(recommendation)}
                  />
                ) : null;
              })
            : undefined}
        </RecommendationGroup>

        <section aria-labelledby="not-eligible-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
              Unranked · stored requirements not met
            </p>
            <h2
              id="not-eligible-heading"
              className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Programs currently not eligible
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              These outcomes reflect the stored rules and current student
              information. Admission rules can change annually, so they should
              not be treated as permanent.
            </p>
          </div>
          {presentation.notEligible.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              No program currently falls into the Not eligible classification.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {presentation.notEligible.map((recommendation) => {
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
                            Currently not eligible · no rank
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-lg transition group-open:rotate-45"
                        >
                          +
                        </span>
                      </span>
                    </summary>
                    <div className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">
                      <ul className="space-y-2">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span aria-hidden="true">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                      {program && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p>{program.eligibilityNote}</p>
                          {program.officialSourceUrl && (
                            <a
                              href={program.officialSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex rounded-lg font-bold text-teal-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                            >
                              Check official source
                            </a>
                          )}
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
          )}
        </section>

        <ProfileSummary summary={profileSummary} />

        {payload.version === 2 && (
          <AssessmentFeedbackForm
            assessmentMode={payload.recommendationInput.assessmentMode}
            recommendationCreatedAt={payload.createdAt}
            visiblePlacements={feedbackPlacements}
          />
        )}
      </div>
    </main>
  );
}
