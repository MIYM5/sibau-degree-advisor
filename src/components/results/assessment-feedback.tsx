"use client";

import { useEffect, useState } from "react";

import { programs } from "@/data/programs";
import {
  ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH,
  createAssessmentFeedback,
  getOrCreateAssessmentFeedbackSession,
  submitAssessmentFeedback,
  suggestExpectedChoicePlacement,
} from "@/lib/assessment-feedback";
import type { AssessmentMode } from "@/types/assessment-mode";
import type {
  AssessmentFeedbackExpectedChoice,
  AssessmentFeedbackPlacement,
  AssessmentFeedbackRating,
  AssessmentFeedbackSessionPayload,
  AssessmentFeedbackValidationError,
} from "@/types/assessment-feedback";
import type { ProgramId } from "@/types/program";

interface AssessmentFeedbackProps {
  assessmentMode: AssessmentMode;
  recommendationCreatedAt: string;
  visiblePlacements: Readonly<
    Partial<Record<ProgramId, AssessmentFeedbackPlacement>>
  >;
}

interface RatingQuestion {
  field:
    | "interestAlignmentRating"
    | "personalRelevanceRating"
    | "explanationUsefulnessRating";
  legend: string;
  labels: readonly string[];
}

const ratingQuestions: readonly RatingQuestion[] = [
  {
    field: "interestAlignmentRating",
    legend:
      "Do these recommendations match the subjects, activities, and fields you are interested in?",
    labels: ["Not at all", "Slightly", "Somewhat", "Mostly", "Very well"],
  },
  {
    field: "personalRelevanceRating",
    legend:
      "Can you see yourself studying at least one of the recommended degree programs?",
    labels: [
      "Definitely not",
      "Probably not",
      "Not sure",
      "Probably yes",
      "Definitely yes",
    ],
  },
  {
    field: "explanationUsefulnessRating",
    legend:
      "How useful were the explanations about why each program matched your profile?",
    labels: [
      "Not useful",
      "Slightly useful",
      "Somewhat useful",
      "Useful",
      "Very useful",
    ],
  },
];

const placementOptions: readonly {
  value: AssessmentFeedbackPlacement;
  label: string;
}[] = [
  { value: "top_three", label: "Top three" },
  { value: "alternative_options", label: "Alternative options" },
  {
    value: "verification_required",
    label: "Admission verification required",
  },
  { value: "not_eligible", label: "Not currently eligible" },
  { value: "not_recommended", label: "Not recommended" },
  { value: "no_previous_choice", label: "No previous choice" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

export function AssessmentFeedbackForm({
  assessmentMode,
  recommendationCreatedAt,
  visiblePlacements,
}: AssessmentFeedbackProps) {
  const [session, setSession] = useState<
    AssessmentFeedbackSessionPayload | null
  >(null);
  const [isReady, setIsReady] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [ratings, setRatings] = useState<
    Partial<Record<RatingQuestion["field"], AssessmentFeedbackRating>>
  >({});
  const [expectedChoice, setExpectedChoice] = useState<
    AssessmentFeedbackExpectedChoice | ""
  >("");
  const [placement, setPlacement] = useState<
    AssessmentFeedbackPlacement | ""
  >("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<AssessmentFeedbackValidationError[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSession(
        getOrCreateAssessmentFeedbackSession(
          window.sessionStorage,
          recommendationCreatedAt,
        ),
      );
      setIsReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [recommendationCreatedAt]);

  function messagesFor(field: AssessmentFeedbackValidationError["field"]) {
    return errors.filter((item) => item.field === field).map((item) => item.message);
  }

  function updateExpectedChoice(value: string) {
    const selected = value as AssessmentFeedbackExpectedChoice | "";
    setExpectedChoice(selected);
    setPlacement(
      selected
        ? (suggestExpectedChoicePlacement(selected, visiblePlacements) ?? "")
        : "",
    );
    setErrors([]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    const clientErrors: AssessmentFeedbackValidationError[] = [];
    for (const question of ratingQuestions) {
      if (!ratings[question.field]) {
        clientErrors.push({
          field: question.field,
          code: "rating_required",
          message: "Choose one response before submitting.",
        });
      }
    }
    if (!expectedChoice) {
      clientErrors.push({
        field: "previouslyConsideredProgramId",
        code: "previous_choice_required",
        message: "Choose a previous-choice option.",
      });
    }
    if (!placement) {
      clientErrors.push({
        field: "expectedChoicePlacement",
        code: "placement_required",
        message: "Confirm where your previous choice appeared.",
      });
    }
    if (comment.length > ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH) {
      clientErrors.push({
        field: "optionalComment",
        code: "comment_too_long",
        message: `Comment must be ${ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH} characters or fewer.`,
      });
    }
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    const created = createAssessmentFeedback({
      assessmentSessionId: session.assessmentSessionId,
      assessmentMode,
      interestAlignmentRating: ratings.interestAlignmentRating!,
      personalRelevanceRating: ratings.personalRelevanceRating!,
      explanationUsefulnessRating: ratings.explanationUsefulnessRating!,
      expectedChoice: expectedChoice as AssessmentFeedbackExpectedChoice,
      expectedChoicePlacement: placement as AssessmentFeedbackPlacement,
      optionalComment: comment,
    });
    if (!created.isValid || !created.feedback) {
      setErrors(created.errors);
      return;
    }

    const submitted = submitAssessmentFeedback(
      window.sessionStorage,
      session,
      created.feedback,
    );
    if (!submitted.isValid || !submitted.feedback) {
      setErrors(submitted.errors);
      return;
    }
    setSession({ ...session, feedback: submitted.feedback });
    setErrors([]);
  }

  const modeNote =
    assessmentMode === "quick"
      ? "You completed the brief assessment. Your feedback helps us understand whether a short assessment can still identify relevant degree options."
      : "You completed the detailed assessment. Your feedback helps us evaluate whether the longer RIASEC profile produced more relevant recommendations.";

  if (!isReady) {
    return (
      <section
        aria-labelledby="assessment-feedback-heading"
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <h2 id="assessment-feedback-heading" className="text-xl font-bold">
          Help us improve these recommendations
        </h2>
        <p className="mt-2 text-sm text-slate-600">Loading feedback optionsâ€¦</p>
      </section>
    );
  }

  if (session?.feedback) {
    return (
      <section
        aria-labelledby="assessment-feedback-heading"
        className="rounded-[1.5rem] border border-teal-200 bg-teal-50 p-5 shadow-sm sm:p-7"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          Feedback submitted
        </p>
        <h2 id="assessment-feedback-heading" className="mt-2 text-2xl font-bold">
          Thank you
        </h2>
        <p className="mt-3 leading-7 text-teal-950">
          Thank you. Your feedback has been recorded separately from your
          recommendation result.
        </p>
      </section>
    );
  }

  if (isSkipped) {
    return (
      <section
        aria-labelledby="assessment-feedback-heading"
        className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <h2 id="assessment-feedback-heading" className="text-2xl font-bold">
          Help us improve these recommendations
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Feedback is hidden for now. You can reopen it while this result
          session remains available.
        </p>
        <button
          type="button"
          onClick={() => setIsSkipped(false)}
          className="secondary-button mt-5"
        >
          Reopen Feedback
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="assessment-feedback-heading"
      className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
        Optional post-results feedback
      </p>
      <h2
        id="assessment-feedback-heading"
        className="mt-2 font-serif text-3xl font-bold tracking-tight"
      >
        Help us improve these recommendations
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Your feedback will not change your current results. It will help us
        evaluate and improve the assessment.
      </p>
      <p className="mt-3 max-w-3xl rounded-xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
        {modeNote}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-7">
        {ratingQuestions.map((question) => {
          const fieldErrors = messagesFor(question.field);
          return (
            <fieldset
              key={question.field}
              className="rounded-2xl border border-slate-200 p-4 sm:p-5"
            >
              <legend className="px-1 font-bold leading-6 text-slate-950">
                {question.legend}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                {question.labels.map((label, index) => {
                  const rating = (index + 1) as AssessmentFeedbackRating;
                  const inputId = `${question.field}-${rating}`;
                  return (
                    <label
                      key={inputId}
                      htmlFor={inputId}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold transition hover:border-teal-400 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 has-[:focus-visible]:ring-offset-2"
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={question.field}
                        value={rating}
                        checked={ratings[question.field] === rating}
                        onChange={() => {
                          setRatings((current) => ({
                            ...current,
                            [question.field]: rating,
                          }));
                          setErrors([]);
                        }}
                        className="size-4 accent-teal-700"
                      />
                      <span>
                        <span className="block text-xs text-slate-500">
                          {rating}
                        </span>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.map((message) => (
                <p key={message} role="alert" className="mt-3 text-sm font-bold text-red-700">
                  {message}
                </p>
              ))}
            </fieldset>
          );
        })}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="previous-choice" className="block font-bold text-slate-950">
              Before taking this assessment, which degree or field were you
              already considering?
            </label>
            <select
              id="previous-choice"
              value={expectedChoice}
              onChange={(event) => updateExpectedChoice(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <option value="">Select an option</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
              <option value="outside_sibau">Another field not offered by SIBAU</option>
              <option value="no_previous_choice">I had no program in mind</option>
              <option value="prefer_not_to_answer">Prefer not to answer</option>
            </select>
            {messagesFor("previouslyConsideredProgramId").map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm font-bold text-red-700">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="choice-placement" className="block font-bold text-slate-950">
              Where did your previously considered choice appear?
            </label>
            <select
              id="choice-placement"
              value={placement}
              onChange={(event) => {
                setPlacement(event.target.value as AssessmentFeedbackPlacement | "");
                setErrors([]);
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <option value="">Select an option</option>
              {placementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              A SIBAU program may be suggested from the visible result groups.
              Please confirm or change the selection. Other choices are never
              inferred.
            </p>
            {messagesFor("expectedChoicePlacement").map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm font-bold text-red-700">
                {message}
              </p>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-comment" className="block font-bold text-slate-950">
            What did the recommendations understand correctly, or what important
            interest did they miss? <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setErrors([]);
            }}
            maxLength={ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH + 1}
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600"
          />
          <div className="mt-2 flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-500">
              Do not include names, contact information, or other personal details.
            </span>
            <span className={comment.length > 300 ? "font-bold text-red-700" : "text-slate-500"}>
              {comment.length}/{ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH}
            </span>
          </div>
          {messagesFor("optionalComment").map((message) => (
            <p key={message} role="alert" className="mt-2 text-sm font-bold text-red-700">
              {message}
            </p>
          ))}
        </div>

        {messagesFor("payload").concat(messagesFor("session")).map((message) => (
          <p key={message} role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {message}
          </p>
        ))}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
          <button type="submit" className="primary-button">
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={() => setIsSkipped(true)}
            className="secondary-button"
          >
            Skip for Now
          </button>
        </div>
      </form>
    </section>
  );
}
