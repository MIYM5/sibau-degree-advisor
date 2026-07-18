"use client";

import { useState } from "react";

import {
  aptitudeDimensionLabels,
  aptitudeQuestions,
  type AptitudeQuestionId,
  type AptitudeResponseValue,
} from "@/data/aptitude-questions";
import {
  calculateAptitudeAssessment,
  isAptitudeResponseValue,
  type AptitudeResponses,
} from "@/lib/aptitude-assessment";

interface AptitudeStepProps {
  responses: AptitudeResponses;
  onAnswer: (questionId: AptitudeQuestionId, value: AptitudeResponseValue) => void;
  onBackToInterests: () => void;
  onComplete: () => void;
}

const responseOptions = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const satisfies readonly {
  value: AptitudeResponseValue;
  label: string;
}[];

export function AptitudeStep({
  responses,
  onAnswer,
  onBackToInterests,
  onComplete,
}: AptitudeStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string>();
  const question = aptitudeQuestions[currentQuestionIndex];
  const response = responses[question.id];
  const progress = ((currentQuestionIndex + 1) / aptitudeQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === aptitudeQuestions.length - 1;

  function goForward() {
    if (response === undefined || !isAptitudeResponseValue(response)) {
      setValidationMessage("Choose one response before continuing.");
      return;
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex((index) => index + 1);
      setValidationMessage(undefined);
      return;
    }

    const result = calculateAptitudeAssessment(responses);
    if (!result.isValid) {
      const firstMissingId =
        result.missingQuestionIds[0] ?? result.invalidQuestionIds[0];
      const missingIndex = aptitudeQuestions.findIndex(
        (candidate) => candidate.id === firstMissingId,
      );
      if (missingIndex >= 0) setCurrentQuestionIndex(missingIndex);
      setValidationMessage(
        `Answer all ${aptitudeQuestions.length} questions before continuing to review.`,
      );
      return;
    }

    onComplete();
  }

  return (
    <section aria-labelledby="aptitude-assessment-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 4 of 5
          </p>
          <h1
            id="aptitude-assessment-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Aptitude self-assessment
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Think about how you usually approach learning and group tasks, then
            choose the response that feels most accurate for you.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToInterests}
          className="secondary-button shrink-0"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          Interests
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        This is a self-assessment for educational guidance, not a validated
        psychometric test.
      </div>

      <div
        className="mt-8"
        aria-label={`Question ${currentQuestionIndex + 1} of ${aptitudeQuestions.length}`}
      >
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span className="text-slate-900">
            Question {currentQuestionIndex + 1} of {aptitudeQuestions.length}
          </span>
          <span className="text-teal-700">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {aptitudeDimensionLabels[question.dimension]}
        </p>

        <fieldset className="mt-4">
          <legend className="max-w-3xl text-xl font-bold leading-8 text-slate-950 sm:text-2xl sm:leading-9">
            {question.statement}
          </legend>

          <div className="mt-7 grid gap-3 sm:grid-cols-5">
            {responseOptions.map((option) => {
              const isSelected = response === option.value;

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
              onBackToInterests();
            } else {
              setCurrentQuestionIndex((index) => index - 1);
              setValidationMessage(undefined);
            }
          }}
          className="secondary-button"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          {currentQuestionIndex === 0
            ? "Back to interests"
            : "Previous question"}
        </button>
        <button type="button" onClick={goForward} className="primary-button">
          {isLastQuestion ? "Continue to review" : "Next question"}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
      </div>
    </section>
  );
}
