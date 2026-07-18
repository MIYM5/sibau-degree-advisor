"use client";

import { useState } from "react";

import { detailedRiasecQuestions } from "@/data/detailed-riasec-questions";
import {
  calculateDetailedRiasecAssessment,
  DETAILED_RIASEC_DISCLAIMER,
  isDetailedRiasecResponseValue,
} from "@/lib/detailed-riasec-assessment";
import type {
  DetailedRiasecQuestionId,
  DetailedRiasecResponse,
  DetailedRiasecResponseValue,
} from "@/types/detailed-interest";

interface DetailedInterestStepProps {
  responses: readonly DetailedRiasecResponse[];
  onAnswer: (
    questionId: DetailedRiasecQuestionId,
    value: DetailedRiasecResponseValue,
  ) => void;
  onBackToSubjects: () => void;
  onComplete: () => void;
}

const responseOptions = [
  { value: 1, label: "Strongly Dislike" },
  { value: 2, label: "Dislike" },
  { value: 3, label: "Unsure" },
  { value: 4, label: "Like" },
  { value: 5, label: "Strongly Like" },
] as const satisfies readonly {
  value: DetailedRiasecResponseValue;
  label: string;
}[];

export function DetailedInterestStep({
  responses,
  onAnswer,
  onBackToSubjects,
  onComplete,
}: DetailedInterestStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string>();
  const [showSummary, setShowSummary] = useState(false);
  const question = detailedRiasecQuestions[currentQuestionIndex];
  const response = responses.find(
    (candidate) => candidate.questionId === question.id,
  );
  const result = calculateDetailedRiasecAssessment(responses);
  const progress =
    ((currentQuestionIndex + 1) / detailedRiasecQuestions.length) * 100;
  const isLastQuestion =
    currentQuestionIndex === detailedRiasecQuestions.length - 1;

  function goForward() {
    if (!isDetailedRiasecResponseValue(response?.value)) {
      setValidationMessage("Choose one response before continuing.");
      return;
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex((index) => index + 1);
      setValidationMessage(undefined);
      return;
    }

    if (!result.isValid || !result.profile) {
      const firstMissingId = result.missingQuestionIds[0];
      const firstMissingIndex = detailedRiasecQuestions.findIndex(
        (candidate) => candidate.id === firstMissingId,
      );
      if (firstMissingIndex >= 0) setCurrentQuestionIndex(firstMissingIndex);
      setValidationMessage("Answer all 30 questions before continuing.");
      return;
    }

    setShowSummary(true);
    setValidationMessage(undefined);
  }

  if (showSummary && result.profile) {
    return (
      <section aria-labelledby="detailed-interest-summary-heading">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          Step 3 of 5 Â· Detailed Guidance
        </p>
        <h1
          id="detailed-interest-summary-heading"
          className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Your detailed interest profile
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          All 30 activity-preference questions are complete. Your full
          six-dimension summary will appear again on the Review step.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
              RIASEC profile
            </p>
            <p className="mt-3 font-serif text-5xl font-bold tracking-[0.18em]">
              {result.profile.hollandCode}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {result.profile.topThreeLabels.join(" Â· ")}
            </p>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-teal-950">
            <p className="font-bold">30 of 30 questions answered</p>
            <p className="mt-2 text-sm leading-6">
              Evidence label: <strong>{result.evidenceLabel}</strong>. Scores
              preserve full precision and are rounded only when displayed.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          {DETAILED_RIASEC_DISCLAIMER}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setShowSummary(false);
              setCurrentQuestionIndex(detailedRiasecQuestions.length - 1);
            }}
            className="secondary-button"
          >
            Back to questions
          </button>
          <button type="button" onClick={onComplete} className="primary-button">
            Continue to aptitude
            <span aria-hidden="true" className="ml-2">
              â†’
            </span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="detailed-interest-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 3 of 5 Â· Detailed Guidance
          </p>
          <h1
            id="detailed-interest-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Detailed interest assessment
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Rate how much you would like each activity. Choose based on your
            preference, not how skilled you think you are.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToSubjects}
          className="secondary-button shrink-0"
        >
          <span aria-hidden="true" className="mr-2">
            â†
          </span>
          Subject marks
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {DETAILED_RIASEC_DISCLAIMER}
      </div>

      <div
        className="mt-8"
        aria-label={`Question ${currentQuestionIndex + 1} of ${detailedRiasecQuestions.length}`}
      >
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span className="text-slate-900">
            Question {currentQuestionIndex + 1} of {detailedRiasecQuestions.length}
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

      <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-8">
        <fieldset>
          <legend className="max-w-3xl text-xl font-bold leading-8 text-slate-950 sm:text-2xl sm:leading-9">
            {question.statement}
          </legend>
          <p className="mt-2 text-sm text-slate-600">
            How much would you like this activity?
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-5">
            {responseOptions.map((option) => {
              const isSelected = response?.value === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex min-h-20 cursor-pointer items-center rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 sm:flex-col sm:justify-center sm:text-center ${
                    isSelected
                      ? "border-teal-600 bg-teal-50 text-teal-950 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => {
                      onAnswer(question.id, option.value);
                      setValidationMessage(undefined);
                    }}
                    className="size-5 shrink-0 accent-teal-700"
                  />
                  <span className="ml-3 text-sm font-bold sm:ml-0 sm:mt-2">
                    {option.label}
                  </span>
                  <span className="ml-auto text-xs font-bold text-slate-400 sm:ml-0 sm:mt-1">
                    {option.value}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {validationMessage && (
          <p
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
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
            if (currentQuestionIndex === 0) {
              onBackToSubjects();
            } else {
              setCurrentQuestionIndex((index) => index - 1);
              setValidationMessage(undefined);
            }
          }}
          className="secondary-button"
        >
          <span aria-hidden="true" className="mr-2">
            â†
          </span>
          {currentQuestionIndex === 0
            ? "Back to subject marks"
            : "Previous question"}
        </button>
        <button type="button" onClick={goForward} className="primary-button">
          {isLastQuestion ? "Review interest profile" : "Next question"}
          <span aria-hidden="true" className="ml-2">
            â†’
          </span>
        </button>
      </div>
    </section>
  );
}
