"use client";

import { useState } from "react";

import { quickInterestScenarios } from "@/data/quick-interest-scenarios";
import {
  calculateQuickInterestAssessment,
  QUICK_INTEREST_DISCLAIMER,
} from "@/lib/quick-interest-assessment";
import { riasecDimensionLabels } from "@/types/riasec";
import type {
  QuickInterestChoiceId,
  QuickInterestResponse,
  QuickInterestResponseDraft,
} from "@/types/quick-interest";

interface QuickInterestStepProps {
  responses: readonly QuickInterestResponseDraft[];
  onChange: (response: QuickInterestResponseDraft) => void;
  onBackToSubjects: () => void;
  onComplete: () => void;
}

const preferencePositions = [
  {
    field: "mostPreferredChoiceId",
    label: "Most preferred",
    shortLabel: "Most",
    points: "+2",
  },
  {
    field: "secondPreferredChoiceId",
    label: "Second preferred",
    shortLabel: "Second",
    points: "+1",
  },
  {
    field: "leastPreferredChoiceId",
    label: "Least preferred",
    shortLabel: "Least",
    points: "−1",
  },
] as const;

function isCompleteResponse(
  response: QuickInterestResponseDraft | undefined,
): response is QuickInterestResponse {
  if (
    !response?.mostPreferredChoiceId ||
    !response.secondPreferredChoiceId ||
    !response.leastPreferredChoiceId
  ) {
    return false;
  }
  return (
    new Set([
      response.mostPreferredChoiceId,
      response.secondPreferredChoiceId,
      response.leastPreferredChoiceId,
    ]).size === 3
  );
}

export function QuickInterestStep({
  responses,
  onChange,
  onBackToSubjects,
  onComplete,
}: QuickInterestStepProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string>();
  const [showSummary, setShowSummary] = useState(false);
  const scenario = quickInterestScenarios[currentScenarioIndex];
  const response = responses.find(
    (candidate) => candidate.scenarioId === scenario.id,
  );
  const result = calculateQuickInterestAssessment(responses);
  const progress =
    ((currentScenarioIndex + 1) / quickInterestScenarios.length) * 100;
  const isLastScenario =
    currentScenarioIndex === quickInterestScenarios.length - 1;

  function choosePreference(
    field: (typeof preferencePositions)[number]["field"],
    choiceId: QuickInterestChoiceId,
  ) {
    onChange({
      scenarioId: scenario.id,
      ...response,
      [field]: choiceId,
    });
    setValidationMessage(undefined);
  }

  function goForward() {
    if (!isCompleteResponse(response)) {
      setValidationMessage(
        "Choose three different activities: one most preferred, one second preferred, and one least preferred.",
      );
      return;
    }

    if (!isLastScenario) {
      setCurrentScenarioIndex((index) => index + 1);
      setValidationMessage(undefined);
      return;
    }

    if (!result.isValid || !result.profile) {
      const firstIncompleteIndex = quickInterestScenarios.findIndex(
        (candidate) =>
          !isCompleteResponse(
            responses.find(
              (responseCandidate) =>
                responseCandidate.scenarioId === candidate.id,
            ),
          ),
      );
      if (firstIncompleteIndex >= 0) setCurrentScenarioIndex(firstIncompleteIndex);
      setValidationMessage("Complete all five scenarios before continuing.");
      return;
    }

    setShowSummary(true);
    setValidationMessage(undefined);
  }

  if (showSummary && result.profile) {
    return (
      <section aria-labelledby="quick-interest-summary-heading">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          Step 3 of 5 · Quick Guidance
        </p>
        <h1
          id="quick-interest-summary-heading"
          className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Your preliminary interest profile
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          All five scenarios are complete. You can review this short profile
          now and see the full six-dimension summary again on the Review step.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
              Preliminary RIASEC code
            </p>
            <p className="mt-3 font-serif text-5xl font-bold tracking-[0.18em]">
              {result.profile.hollandCode}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {result.profile.topThreeLabels.join(" · ")}
            </p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-teal-950">
            <p className="font-bold">All five scenarios completed</p>
            <p className="mt-2 text-sm leading-6">
              Evidence label: <strong>{result.evidenceLabel}</strong>. Scores
              preserve full precision and are rounded only when displayed.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          {QUICK_INTEREST_DISCLAIMER}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setShowSummary(false);
              setCurrentScenarioIndex(quickInterestScenarios.length - 1);
            }}
            className="secondary-button"
          >
            Back to scenarios
          </button>
          <button type="button" onClick={onComplete} className="primary-button">
            Continue to aptitude
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="quick-interest-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 3 of 5 · Quick Guidance
          </p>
          <h1
            id="quick-interest-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Quick interest scenarios
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            For each situation, choose three different activities: the one you
            would prefer most, the one you would prefer second, and the one you
            would prefer least.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToSubjects}
          className="secondary-button shrink-0"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          Subject marks
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {QUICK_INTEREST_DISCLAIMER}
      </div>

      <div
        className="mt-8"
        aria-label={`Scenario ${currentScenarioIndex + 1} of ${quickInterestScenarios.length}`}
      >
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span className="text-slate-900">
            Scenario {currentScenarioIndex + 1} of {quickInterestScenarios.length}
          </span>
          <span className="text-teal-700">{Math.round(progress)}% viewed</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            {scenario.title}
          </p>
          <h2 className="mt-2 max-w-4xl text-xl font-bold leading-8 text-slate-950 sm:text-2xl sm:leading-9">
            {scenario.question}
          </h2>
        </div>

        <fieldset className="p-4 sm:p-6">
          <legend className="sr-only">
            Rank activities for {scenario.title}
          </legend>

          <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] gap-3 px-4 pb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 md:grid">
            <span className="text-left">Activity</span>
            {preferencePositions.map((position) => (
              <span key={position.field}>
                {position.shortLabel} {position.points}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {scenario.choices.map((choice) => (
              <div
                key={choice.id}
                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] md:items-center md:gap-3"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    {riasecDimensionLabels[choice.dimension]}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                    {choice.statement}
                  </p>
                </div>

                {preferencePositions.map((position) => {
                  const checked = response?.[position.field] === choice.id;
                  const selectedElsewhere = preferencePositions.some(
                    (candidate) =>
                      candidate.field !== position.field &&
                      response?.[candidate.field] === choice.id,
                  );

                  return (
                    <label
                      key={position.field}
                      className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-bold transition focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 md:justify-center ${
                        checked
                          ? "border-teal-600 bg-teal-50 text-teal-950"
                          : selectedElsewhere
                            ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <span className="md:sr-only">
                        {position.label} ({position.points})
                      </span>
                      <input
                        type="radio"
                        name={`${scenario.id}-${position.field}`}
                        value={choice.id}
                        checked={checked}
                        disabled={selectedElsewhere}
                        onChange={() =>
                          choosePreference(position.field, choice.id)
                        }
                        aria-label={`${position.label}: ${choice.statement}`}
                        className="size-5 accent-teal-700"
                      />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </fieldset>

        {validationMessage && (
          <p
            className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:mx-6 sm:mb-6"
            role="alert"
          >
            {validationMessage}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (currentScenarioIndex === 0) {
              onBackToSubjects();
            } else {
              setCurrentScenarioIndex((index) => index - 1);
              setValidationMessage(undefined);
            }
          }}
          className="secondary-button"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          {currentScenarioIndex === 0
            ? "Back to subject marks"
            : "Previous scenario"}
        </button>
        <button type="button" onClick={goForward} className="primary-button">
          {isLastScenario ? "Review interest profile" : "Next scenario"}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
      </div>
    </section>
  );
}
