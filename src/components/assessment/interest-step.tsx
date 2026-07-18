"use client";

import { useState } from "react";

import {
  interestDimensionLabels,
  interestQuestions,
  type InterestQuestionId,
  type InterestResponseValue,
} from "@/data/interest-questions";
import {
  calculateInterestAssessment,
  isInterestResponseValue,
  type InterestResponses,
} from "@/lib/interest-assessment";

interface InterestStepProps {
  responses: InterestResponses;
  onAnswer: (questionId: InterestQuestionId, value: InterestResponseValue) => void;
  onBackToSubjects: () => void;
  onComplete: () => void;
}

const responseOptions = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const satisfies readonly {
  value: InterestResponseValue;
  label: string;
}[];

export function InterestStep({
  responses,
  onAnswer,
  onBackToSubjects,
  onComplete,
}: InterestStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string>();
  const question = interestQuestions[currentQuestionIndex];
  const response = responses[question.id];
  const progress = ((currentQuestionIndex + 1) / interestQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === interestQuestions.length - 1;

  function goForward() {
    if (response === undefined || !isInterestResponseValue(response)) {
      setValidationMessage("Choose one response before continuing.");
      return;
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex((index) => index + 1);
      setValidationMessage(undefined);
      return;
    }

    const result = calculateInterestAssessment(responses);
    if (!result.isValid) {
      const firstMissingId =
        result.missingQuestionIds[0] ?? result.invalidQuestionIds[0];
      const missingIndex = interestQuestions.findIndex(
        (candidate) => candidate.id === firstMissingId,
      );
      if (missingIndex >= 0) setCurrentQuestionIndex(missingIndex);
      setValidationMessage(
        `Answer all ${interestQuestions.length} questions before continuing to review.`,
      );
      return;
    }

    onComplete();
  }

  return (
    <section aria-labelledby="interest-assessment-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 3 of 4
          </p>
          <h1
            id="interest-assessment-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Interest assessment
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Choose the response that feels most accurate for you. There are no
            right or wrong answers.
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

      <div className="mt-8" aria-label={`Question ${currentQuestionIndex + 1} of ${interestQuestions.length}`}>
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span className="text-slate-900">
            Question {currentQuestionIndex + 1} of {interestQuestions.length}
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
          {interestDimensionLabels[question.dimension]}
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
              onBackToSubjects();
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
          {currentQuestionIndex === 0 ? "Back to subject marks" : "Previous question"}
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
