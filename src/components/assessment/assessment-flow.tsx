"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  AptitudeQuestionId,
  AptitudeResponseValue,
} from "@/data/aptitude-questions";
import type {
  InterestQuestionId,
  InterestResponseValue,
} from "@/data/interest-questions";
import {
  getSuggestedSubjectRows,
  intermediateGroups,
  toSubjectMarks,
  validateBasicInformation,
  validateSubjectMarkRows,
  type BasicInformationErrors,
  type SubjectMarkDraft,
  type SubjectMarksValidationResult,
} from "@/lib/assessment-form";
import { buildStudentProfile } from "@/lib/assessment-to-student-profile";
import {
  ASSESSMENT_DRAFT_SESSION_KEY,
  RECOMMENDATION_SESSION_KEY,
  createRecommendationSessionPayload,
  parseAssessmentSessionDraft,
  type AssessmentSessionDraft,
} from "@/lib/assessment-session";
import {
  calculateAptitudeAssessment,
  type AptitudeResponses,
} from "@/lib/aptitude-assessment";
import {
  calculateInterestAssessment,
  type InterestResponses,
} from "@/lib/interest-assessment";
import { generateRecommendations } from "@/lib/recommendation-engine";
import type { IntermediateGroup } from "@/types/program";

import { AptitudeStep } from "./aptitude-step";
import { InterestStep } from "./interest-step";
import { ProgressSteps } from "./progress-steps";
import { ReviewStep } from "./review-step";
import { SubjectMarksStep } from "./subject-marks-step";

const emptySubjectValidation: SubjectMarksValidationResult = {
  rowErrors: {},
  isValid: false,
};

export function AssessmentFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [intermediateGroup, setIntermediateGroup] = useState<
    IntermediateGroup | ""
  >(
    "",
  );
  const [initializedGroup, setInitializedGroup] = useState<
    IntermediateGroup | ""
  >(
    "",
  );
  const [subjectRows, setSubjectRows] = useState<SubjectMarkDraft[]>([]);
  const [basicErrors, setBasicErrors] = useState<BasicInformationErrors>({});
  const [subjectValidation, setSubjectValidation] =
    useState<SubjectMarksValidationResult>(emptySubjectValidation);
  const [interestResponses, setInterestResponses] = useState<InterestResponses>({});
  const interestAssessment = calculateInterestAssessment(interestResponses);
  const [aptitudeResponses, setAptitudeResponses] = useState<AptitudeResponses>({});
  const aptitudeAssessment = calculateAptitudeAssessment(aptitudeResponses);
  const [recommendationError, setRecommendationError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);

  const completedAssessment = intermediateGroup
    ? {
        name,
        intermediateGroup,
        subjectMarks: toSubjectMarks(subjectRows),
        interestResponses,
        aptitudeResponses,
      }
    : null;
  const profileBuild = completedAssessment
    ? buildStudentProfile(completedAssessment)
    : null;
  const studentProfile = profileBuild?.isValid ? profileBuild.profile : null;

  useEffect(() => {
    const savedDraft = parseAssessmentSessionDraft(
      window.sessionStorage.getItem(ASSESSMENT_DRAFT_SESSION_KEY),
    );
    if (!savedDraft) return;

    const frame = window.requestAnimationFrame(() => {
      setName(savedDraft.name);
      setIntermediateGroup(savedDraft.intermediateGroup);
      setInitializedGroup(savedDraft.intermediateGroup);
      setSubjectRows(savedDraft.subjectRows);
      setInterestResponses(savedDraft.interestResponses);
      setAptitudeResponses(savedDraft.aptitudeResponses);
      setCurrentStep(5);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function continueFromBasicInformation() {
    const errors = validateBasicInformation(name, intermediateGroup);
    setBasicErrors(errors);
    if (Object.keys(errors).length > 0 || !intermediateGroup) return;

    if (initializedGroup !== intermediateGroup) {
      setSubjectRows(getSuggestedSubjectRows(intermediateGroup));
      setInitializedGroup(intermediateGroup);
      setSubjectValidation(emptySubjectValidation);
    }
    setCurrentStep(2);
  }

  function updateSubjectRow(
    index: number,
    patch: Partial<SubjectMarkDraft>,
  ) {
    setSubjectRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
    setSubjectValidation(emptySubjectValidation);
  }

  function addOptionalSubject() {
    setSubjectRows((rows) => [...rows, { isOptional: true }]);
    setSubjectValidation(emptySubjectValidation);
  }

  function removeOptionalSubject(index: number) {
    setSubjectRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    setSubjectValidation(emptySubjectValidation);
  }

  function continueToInterestAssessment() {
    const validation = validateSubjectMarkRows(subjectRows);
    setSubjectValidation(validation);
    if (!validation.isValid) return;
    setCurrentStep(3);
  }

  function answerInterestQuestion(
    questionId: InterestQuestionId,
    value: InterestResponseValue,
  ) {
    setInterestResponses((responses) => ({
      ...responses,
      [questionId]: value,
    }));
  }

  function continueToAptitudeAssessment() {
    if (!interestAssessment.isValid) return;
    setCurrentStep(4);
  }

  function answerAptitudeQuestion(
    questionId: AptitudeQuestionId,
    value: AptitudeResponseValue,
  ) {
    setAptitudeResponses((responses) => ({
      ...responses,
      [questionId]: value,
    }));
  }

  function continueToReview() {
    if (!aptitudeAssessment.isValid) return;
    setCurrentStep(5);
  }

  function viewRecommendations() {
    setRecommendationError(undefined);
    if (!completedAssessment) {
      setRecommendationError(
        "The assessment is incomplete. Review the earlier steps and try again.",
      );
      return;
    }

    const buildResult = buildStudentProfile(completedAssessment);
    if (!buildResult.isValid) {
      setRecommendationError(buildResult.errors.join(" "));
      return;
    }

    setIsGenerating(true);
    try {
      const assessmentDraft: AssessmentSessionDraft = {
        name,
        intermediateGroup: completedAssessment.intermediateGroup,
        subjectRows,
        interestResponses,
        aptitudeResponses,
      };
      const recommendationResult = generateRecommendations(buildResult.profile);
      const payload = createRecommendationSessionPayload(
        assessmentDraft,
        buildResult.profile,
        recommendationResult,
      );

      window.sessionStorage.setItem(
        ASSESSMENT_DRAFT_SESSION_KEY,
        JSON.stringify(assessmentDraft),
      );
      window.sessionStorage.setItem(
        RECOMMENDATION_SESSION_KEY,
        JSON.stringify(payload),
      );
      router.push("/results");
    } catch {
      setIsGenerating(false);
      setRecommendationError(
        "Recommendations could not be prepared in this browser session. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)] sm:p-8 lg:p-10">
        <ProgressSteps currentStep={currentStep} />

        <div className="mt-10 border-t border-slate-200 pt-8 sm:mt-12 sm:pt-10">
          {currentStep === 1 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                continueFromBasicInformation();
              }}
              noValidate
            >
              <section aria-labelledby="basic-information-heading">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                  Step 1 of 5
                </p>
                <h1
                  id="basic-information-heading"
                  className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
                >
                  Tell us about your studies
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  Start with basic academic information. Nothing is saved, and
                  you can review every entry before moving on.
                </p>

                <div className="mt-8 max-w-xl">
                  <label
                    htmlFor="student-name"
                    className="mb-2 block text-sm font-bold text-slate-900"
                  >
                    Student name
                  </label>
                  <input
                    id="student-name"
                    name="student-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setBasicErrors((errors) => ({ ...errors, name: undefined }));
                    }}
                    aria-invalid={Boolean(basicErrors.name)}
                    aria-describedby={basicErrors.name ? "student-name-error" : "student-name-help"}
                    className="field-control"
                    placeholder="Enter your name"
                  />
                  <p id="student-name-help" className="mt-2 text-sm text-slate-500">
                    Used only to personalize this assessment review.
                  </p>
                  {basicErrors.name && (
                    <p
                      id="student-name-error"
                      className="mt-2 text-sm font-medium text-red-700"
                      role="alert"
                    >
                      {basicErrors.name}
                    </p>
                  )}
                </div>

                <fieldset className="mt-9">
                  <legend className="text-base font-bold text-slate-950">
                    Intermediate group
                  </legend>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the group shown on your Intermediate or equivalent
                    qualification.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {intermediateGroups.map((group) => (
                      <label
                        key={group}
                        className={`group relative flex min-h-16 cursor-pointer items-center rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 ${
                          intermediateGroup === group
                            ? "border-teal-600 bg-teal-50 text-teal-950 shadow-sm"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="intermediate-group"
                          value={group}
                          checked={intermediateGroup === group}
                          onChange={() => {
                            setIntermediateGroup(group);
                            setBasicErrors((errors) => ({
                              ...errors,
                              intermediateGroup: undefined,
                            }));
                          }}
                          className="size-4 accent-teal-700"
                        />
                        <span className="ml-3 text-sm font-bold">{group}</span>
                      </label>
                    ))}
                  </div>
                  {basicErrors.intermediateGroup && (
                    <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                      {basicErrors.intermediateGroup}
                    </p>
                  )}
                </fieldset>
              </section>

              <div className="mt-10 flex justify-end border-t border-slate-200 pt-6">
                <button type="submit" className="primary-button">
                  Continue to subject marks
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                continueToInterestAssessment();
              }}
              noValidate
            >
              <SubjectMarksStep
                rows={subjectRows}
                validation={subjectValidation}
                onChange={updateSubjectRow}
                onAddOptional={addOptionalSubject}
                onRemoveOptional={removeOptionalSubject}
              />
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="secondary-button"
                >
                  <span aria-hidden="true" className="mr-2">
                    ←
                  </span>
                  Back
                </button>
                <button type="submit" className="primary-button">
                  Continue to interests
                  <span aria-hidden="true" className="ml-2">
                    →
                  </span>
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <InterestStep
              responses={interestResponses}
              onAnswer={answerInterestQuestion}
              onBackToSubjects={() => setCurrentStep(2)}
              onComplete={continueToAptitudeAssessment}
            />
          )}

          {currentStep === 4 && (
            <AptitudeStep
              responses={aptitudeResponses}
              onAnswer={answerAptitudeQuestion}
              onBackToInterests={() => setCurrentStep(3)}
              onComplete={continueToReview}
            />
          )}

          {currentStep === 5 && studentProfile && (
            <div>
              <ReviewStep studentProfile={studentProfile} />
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="secondary-button"
                >
                  <span aria-hidden="true" className="mr-2">
                    ←
                  </span>
                  Edit aptitude answers
                </button>
                <button
                  type="button"
                  onClick={viewRecommendations}
                  disabled={isGenerating}
                  className="primary-button disabled:cursor-wait disabled:bg-slate-400"
                >
                  {isGenerating
                    ? "Preparing recommendations…"
                    : "View My Recommendations"}
                </button>
              </div>
              {recommendationError && (
                <p
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                  role="alert"
                >
                  {recommendationError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
