"use client";

import { useState } from "react";

import {
  briefAptitudeTasks,
  BRIEF_APTITUDE_DISCLAIMER,
} from "@/data/brief-aptitude-tasks";
import type {
  BriefAptitudeChoiceId,
  BriefAptitudeResponse,
  BriefAptitudeTaskId,
} from "@/types/brief-aptitude";

interface BriefAptitudeStepProps {
  responses: readonly BriefAptitudeResponse[];
  onAnswer: (
    taskId: BriefAptitudeTaskId,
    selectedChoiceId: BriefAptitudeChoiceId,
  ) => void;
  onBackToInterests: () => void;
  onComplete: () => void;
}

export function BriefAptitudeStep({
  responses,
  onAnswer,
  onBackToInterests,
  onComplete,
}: BriefAptitudeStepProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string>();
  const task = briefAptitudeTasks[currentTaskIndex];
  const response = responses.find((candidate) => candidate.taskId === task.id);
  const progress = ((currentTaskIndex + 1) / briefAptitudeTasks.length) * 100;
  const isLastTask = currentTaskIndex === briefAptitudeTasks.length - 1;

  function goForward() {
    if (
      !response ||
      !task.choices.some(
        (choice) => choice.id === response.selectedChoiceId,
      )
    ) {
      setValidationMessage("Choose one answer before continuing.");
      return;
    }

    if (!isLastTask) {
      setCurrentTaskIndex((index) => index + 1);
      setValidationMessage(undefined);
      return;
    }

    const firstMissingIndex = briefAptitudeTasks.findIndex(
      (candidate) =>
        !responses.some(
          (responseCandidate) => responseCandidate.taskId === candidate.id,
        ),
    );
    if (firstMissingIndex >= 0) {
      setCurrentTaskIndex(firstMissingIndex);
      setValidationMessage("Answer all five aptitude questions before review.");
      return;
    }

    onComplete();
  }

  return (
    <section aria-labelledby="brief-aptitude-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            Step 4 of 5
          </p>
          <h1
            id="brief-aptitude-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Brief aptitude exercise
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Choose the best answer for each reasoning task. You can move back
            to review or change any response before seeing your summary.
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

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {BRIEF_APTITUDE_DISCLAIMER}
      </div>

      <div
        className="mt-8"
        aria-label={`Question ${currentTaskIndex + 1} of ${briefAptitudeTasks.length}`}
      >
        <div className="flex items-center justify-between gap-4 text-sm font-bold">
          <span className="text-slate-900">
            Question {currentTaskIndex + 1} of {briefAptitudeTasks.length}
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          {task.title}
        </p>

        <fieldset className="mt-4">
          <legend className="max-w-3xl whitespace-pre-line text-xl font-bold leading-8 text-slate-950 sm:text-2xl sm:leading-9">
            {task.question}
          </legend>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {task.choices.map((choice) => {
              const isSelected = response?.selectedChoiceId === choice.id;
              return (
                <label
                  key={choice.id}
                  className={`flex min-h-16 cursor-pointer items-center rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50 text-teal-950 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name={task.id}
                    value={choice.id}
                    checked={isSelected}
                    onChange={() => {
                      onAnswer(task.id, choice.id);
                      setValidationMessage(undefined);
                    }}
                    className="size-5 shrink-0 accent-teal-700"
                  />
                  <span className="ml-3 flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                      {choice.label}
                    </span>
                    <span className="font-semibold">{choice.text}</span>
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
            if (currentTaskIndex === 0) {
              onBackToInterests();
            } else {
              setCurrentTaskIndex((index) => index - 1);
              setValidationMessage(undefined);
            }
          }}
          className="secondary-button"
        >
          <span aria-hidden="true" className="mr-2">
            ←
          </span>
          {currentTaskIndex === 0 ? "Back to interests" : "Previous question"}
        </button>
        <button type="button" onClick={goForward} className="primary-button">
          {isLastTask ? "Continue to review" : "Next question"}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
      </div>
    </section>
  );
}
