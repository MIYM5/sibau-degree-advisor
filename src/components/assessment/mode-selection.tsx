"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ASSESSMENT_MODE_SESSION_KEY,
  serializeAssessmentModeSession,
} from "@/lib/assessment-mode-session";
import {
  assessmentModeMetadata,
  getAssessmentModeTotalQuestionCount,
  type AssessmentMode,
} from "@/types/assessment-mode";

const modeDetails: Record<AssessmentMode, readonly string[]> = {
  quick: [
    "5 broad interest scenarios",
    "5 brief objective aptitude tasks",
  ],
  detailed: [
    "30 RIASEC interest items",
    "5 brief objective aptitude tasks",
  ],
};

const modes = [assessmentModeMetadata.quick, assessmentModeMetadata.detailed];

export function ModeSelection() {
  const router = useRouter();
  const [selectionError, setSelectionError] = useState<string>();

  function selectMode(mode: AssessmentMode) {
    setSelectionError(undefined);

    try {
      window.sessionStorage.setItem(
        ASSESSMENT_MODE_SESSION_KEY,
        serializeAssessmentModeSession(mode),
      );
      router.push("/assessment");
    } catch {
      setSelectionError(
        "Your assessment choice could not be saved in this browser session. Please try again.",
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl" aria-labelledby="mode-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
          Version 2.0 assessment
        </p>
        <h1
          id="mode-heading"
          className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl"
        >
          Choose how much guidance you want
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Both options use your academic information and the same transparent
          eligibility checks. Choose the time and depth that suits you today.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {modes.map((mode) => {
          const totalQuestions = getAssessmentModeTotalQuestionCount(mode);
          const isDetailed = mode.id === "detailed";

          return (
            <article
              key={mode.id}
              className={`flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)] ${
                isDetailed ? "border-teal-300" : "border-slate-200"
              }`}
            >
              <div
                className={`border-b px-6 py-5 sm:px-8 ${
                  isDetailed
                    ? "border-teal-200 bg-teal-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                    {mode.evidenceLabel}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-600">
                    Approximately {mode.estimatedMinutes.minimum}–
                    {mode.estimatedMinutes.maximum} minutes
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-950">
                  {mode.title}
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  {mode.description}
                </p>

                <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
                    Assessment length
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums">
                    {totalQuestions} total questions
                  </p>
                </div>

                <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
                  {modeDetails[mode.id].map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-2 shrink-0 rounded-full bg-teal-600"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => selectMode(mode.id)}
                  className={`mt-8 w-full ${
                    isDetailed ? "primary-button" : "secondary-button"
                  }`}
                >
                  Start {mode.title.replace("Guidance", "Assessment")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 sm:p-6">
        <p className="font-bold">Temporary Version 2.0 notice</p>
        <p className="mt-2">
          Quick Guidance now includes five RIASEC interest scenarios but still
          uses the existing aptitude self-assessment temporarily. Detailed
          Guidance now includes 30 RIASEC activity-preference questions and
          also retains the existing aptitude self-assessment temporarily.
        </p>
      </aside>

      {selectionError && (
        <p
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {selectionError}
        </p>
      )}
    </section>
  );
}
