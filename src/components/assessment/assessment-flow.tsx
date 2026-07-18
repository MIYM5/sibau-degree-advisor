"use client";

import Link from "next/link";
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
import {
  buildDetailedStudentProfile,
  buildQuickStudentProfile,
  buildStudentProfile,
  buildVersion2RecommendationInput,
  buildVersion2StudentProfile,
} from "@/lib/assessment-to-student-profile";
import {
  ASSESSMENT_DRAFT_SESSION_KEY,
  RECOMMENDATION_SESSION_KEY,
  createRecommendationSessionPayload,
  createVersion2RecommendationSessionPayload,
  parseAssessmentSessionDraft,
  type AssessmentSessionDraft,
} from "@/lib/assessment-session";
import {
  ASSESSMENT_MODE_SESSION_KEY,
  resolveAssessmentModeSession,
} from "@/lib/assessment-mode-session";
import {
  CONSENT_SESSION_KEY,
  canAccessAssessmentWithConsent,
  resolveConsentAccess,
} from "@/lib/consent-session";
import {
  calculateAptitudeAssessment,
  type AptitudeResponses,
} from "@/lib/aptitude-assessment";
import { calculateBriefAptitudeAssessment } from "@/lib/brief-aptitude-assessment";
import {
  calculateInterestAssessment,
  type InterestResponses,
} from "@/lib/interest-assessment";
import { calculateDetailedRiasecAssessment } from "@/lib/detailed-riasec-assessment";
import {
  generateRecommendations,
  generateVersion2Recommendations,
} from "@/lib/recommendation-engine";
import { calculateQuickInterestAssessment } from "@/lib/quick-interest-assessment";
import {
  assessmentModeMetadata,
  type AssessmentMode,
} from "@/types/assessment-mode";
import type { IntermediateGroup } from "@/types/program";
import type {
  DetailedRiasecQuestionId,
  DetailedRiasecResponse,
  DetailedRiasecResponseValue,
} from "@/types/detailed-interest";
import type {
  BriefAptitudeChoiceId,
  BriefAptitudeResponse,
  BriefAptitudeTaskId,
} from "@/types/brief-aptitude";
import type { QuickInterestResponseDraft } from "@/types/quick-interest";

import { AptitudeStep } from "./aptitude-step";
import { BriefAptitudeStep } from "./brief-aptitude-step";
import { DetailedInterestStep } from "./detailed-interest-step";
import { InterestStep } from "./interest-step";
import { ProgressSteps } from "./progress-steps";
import { QuickInterestStep } from "./quick-interest-step";
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
  const [quickInterestResponses, setQuickInterestResponses] = useState<
    QuickInterestResponseDraft[]
  >([]);
  const quickInterestAssessment = calculateQuickInterestAssessment(
    quickInterestResponses,
  );
  const [detailedInterestResponses, setDetailedInterestResponses] = useState<
    DetailedRiasecResponse[]
  >([]);
  const detailedInterestAssessment = calculateDetailedRiasecAssessment(
    detailedInterestResponses,
  );
  const [aptitudeResponses, setAptitudeResponses] = useState<AptitudeResponses>({});
  const aptitudeAssessment = calculateAptitudeAssessment(aptitudeResponses);
  const [briefAptitudeResponses, setBriefAptitudeResponses] = useState<
    BriefAptitudeResponse[]
  >([]);
  const briefAptitudeAssessment = calculateBriefAptitudeAssessment(
    briefAptitudeResponses,
  );
  const [usesLegacyAptitude, setUsesLegacyAptitude] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<AssessmentMode | "legacy" | null>(
    null,
  );

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
    ? activeMode === "quick"
      ? usesLegacyAptitude
        ? buildQuickStudentProfile({
            name: completedAssessment.name,
            intermediateGroup: completedAssessment.intermediateGroup,
            subjectMarks: completedAssessment.subjectMarks,
            aptitudeResponses: completedAssessment.aptitudeResponses,
          })
        : buildVersion2StudentProfile({
            name: completedAssessment.name,
            intermediateGroup: completedAssessment.intermediateGroup,
            subjectMarks: completedAssessment.subjectMarks,
            briefAptitudeResponses,
          })
      : activeMode === "detailed"
        ? usesLegacyAptitude
          ? buildDetailedStudentProfile({
              name: completedAssessment.name,
              intermediateGroup: completedAssessment.intermediateGroup,
              subjectMarks: completedAssessment.subjectMarks,
              aptitudeResponses: completedAssessment.aptitudeResponses,
            })
          : buildVersion2StudentProfile({
              name: completedAssessment.name,
              intermediateGroup: completedAssessment.intermediateGroup,
              subjectMarks: completedAssessment.subjectMarks,
              briefAptitudeResponses,
            })
        : buildStudentProfile(completedAssessment)
    : null;
  const studentProfile = profileBuild?.isValid ? profileBuild.profile : null;

  useEffect(() => {
    const savedDraft = parseAssessmentSessionDraft(
      window.sessionStorage.getItem(ASSESSMENT_DRAFT_SESSION_KEY),
    );
    const modeResolution = resolveAssessmentModeSession(
      window.sessionStorage.getItem(ASSESSMENT_MODE_SESSION_KEY),
      savedDraft !== null,
    );

    if (modeResolution.status === "selection-required") {
      router.replace("/assessment/mode");
      return;
    }
    if (
      modeResolution.status === "legacy" &&
      savedDraft?.schemaVersion === 2
    ) {
      router.replace("/assessment/mode");
      return;
    }
    if (
      modeResolution.status === "selected" &&
      resolveConsentAccess(
        window.sessionStorage.getItem(CONSENT_SESSION_KEY),
        modeResolution.mode,
        savedDraft !== null && savedDraft.schemaVersion !== 2,
      ) === "consent-required"
    ) {
      router.replace("/consent");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setActiveMode(
        savedDraft?.quickInterestResponses
          ? "quick"
          : savedDraft?.detailedInterestResponses
            ? "detailed"
            : savedDraft
              ? "legacy"
              : modeResolution.status === "selected"
                ? modeResolution.mode
                : "legacy",
      );

      if (savedDraft) {
        setName(savedDraft.name);
        setIntermediateGroup(savedDraft.intermediateGroup);
        setInitializedGroup(savedDraft.intermediateGroup);
        setSubjectRows(savedDraft.subjectRows);
        setInterestResponses(savedDraft.interestResponses);
        setAptitudeResponses(savedDraft.aptitudeResponses);
        setBriefAptitudeResponses(savedDraft.briefAptitudeResponses ?? []);
        setUsesLegacyAptitude(
          Boolean(
            (savedDraft.quickInterestResponses ||
              savedDraft.detailedInterestResponses) &&
              !savedDraft.briefAptitudeResponses,
          ),
        );
        setQuickInterestResponses(savedDraft.quickInterestResponses ?? []);
        setDetailedInterestResponses(
          savedDraft.detailedInterestResponses ?? [],
        );
        setCurrentStep(5);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [router]);

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
    if (
      activeMode === "quick"
        ? !quickInterestAssessment.isValid
        : activeMode === "detailed"
          ? !detailedInterestAssessment.isValid
          : !interestAssessment.isValid
    ) {
      return;
    }
    setCurrentStep(4);
  }

  function answerDetailedInterestQuestion(
    questionId: DetailedRiasecQuestionId,
    value: DetailedRiasecResponseValue,
  ) {
    setDetailedInterestResponses((responses) => {
      const existingIndex = responses.findIndex(
        (response) => response.questionId === questionId,
      );
      const nextResponse = { questionId, value };
      if (existingIndex < 0) return [...responses, nextResponse];
      return responses.map((response, index) =>
        index === existingIndex ? nextResponse : response,
      );
    });
  }

  function updateQuickInterestResponse(
    response: QuickInterestResponseDraft,
  ) {
    setQuickInterestResponses((responses) => {
      const existingIndex = responses.findIndex(
        (candidate) => candidate.scenarioId === response.scenarioId,
      );
      if (existingIndex < 0) return [...responses, response];
      return responses.map((candidate, index) =>
        index === existingIndex ? response : candidate,
      );
    });
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

  function answerBriefAptitudeTask(
    taskId: BriefAptitudeTaskId,
    selectedChoiceId: BriefAptitudeChoiceId,
  ) {
    setBriefAptitudeResponses((responses) => {
      const existingIndex = responses.findIndex(
        (response) => response.taskId === taskId,
      );
      const nextResponse = { taskId, selectedChoiceId };
      if (existingIndex < 0) return [...responses, nextResponse];
      return responses.map((response, index) =>
        index === existingIndex ? nextResponse : response,
      );
    });
  }

  function continueToReview() {
    if (
      activeMode === "legacy" || usesLegacyAptitude
        ? !aptitudeAssessment.isValid
        : !briefAptitudeAssessment.isValid
    ) {
      return;
    }
    setCurrentStep(5);
  }

  function viewRecommendations() {
    setRecommendationError(undefined);
    if (
      activeMode !== null &&
      activeMode !== "legacy" &&
      !usesLegacyAptitude &&
      !canAccessAssessmentWithConsent(
        window.sessionStorage.getItem(CONSENT_SESSION_KEY),
        activeMode,
      )
    ) {
      router.push("/consent");
      return;
    }
    if (!completedAssessment) {
      setRecommendationError(
        "The assessment is incomplete. Review the earlier steps and try again.",
      );
      return;
    }

    if (activeMode === "quick" && !quickInterestAssessment.isValid) {
      setRecommendationError(
        "Complete all five Quick Guidance interest scenarios before continuing.",
      );
      return;
    }
    if (activeMode === "detailed" && !detailedInterestAssessment.isValid) {
      setRecommendationError(
        "Complete all 30 Detailed Guidance interest questions before continuing.",
      );
      return;
    }
    if (
      activeMode !== "legacy" &&
      !usesLegacyAptitude &&
      !briefAptitudeAssessment.isValid
    ) {
      setRecommendationError(
        "Complete all five brief aptitude tasks before continuing.",
      );
      return;
    }

    const buildResult = profileBuild;
    if (!buildResult) {
      setRecommendationError(
        "The assessment profile could not be prepared. Review the earlier steps and try again.",
      );
      return;
    }
    if (!buildResult.isValid) {
      setRecommendationError(buildResult.errors.join(" "));
      return;
    }

    setIsGenerating(true);
    try {
      const assessmentDraft: AssessmentSessionDraft = {
        ...(activeMode !== "legacy" && !usesLegacyAptitude
          ? { schemaVersion: 2 as const }
          : {}),
        name,
        intermediateGroup: completedAssessment.intermediateGroup,
        subjectRows,
        interestResponses,
        aptitudeResponses,
        ...(activeMode === "quick"
          ? { quickInterestResponses: quickInterestAssessment.responses }
          : activeMode === "detailed"
            ? { detailedInterestResponses: detailedInterestAssessment.responses }
            : {}),
        ...(activeMode !== "legacy" && !usesLegacyAptitude
          ? { briefAptitudeResponses: briefAptitudeAssessment.responses }
          : {}),
      };
      const payload =
        assessmentDraft.schemaVersion === 2 && activeMode !== "legacy"
          ? (() => {
              const inputBuild =
                activeMode === "quick"
                  ? buildVersion2RecommendationInput({
                      assessmentMode: "quick",
                      name,
                      intermediateGroup: completedAssessment.intermediateGroup,
                      subjectMarks: completedAssessment.subjectMarks,
                      quickInterestResponses:
                        quickInterestAssessment.responses,
                      briefAptitudeResponses:
                        briefAptitudeAssessment.responses,
                    })
                  : buildVersion2RecommendationInput({
                      assessmentMode: "detailed",
                      name,
                      intermediateGroup: completedAssessment.intermediateGroup,
                      subjectMarks: completedAssessment.subjectMarks,
                      detailedInterestResponses:
                        detailedInterestAssessment.responses,
                      briefAptitudeResponses:
                        briefAptitudeAssessment.responses,
                    });
              if (!inputBuild.isValid) {
                throw new Error(inputBuild.errors.join(" "));
              }
              const recommendationResult =
                generateVersion2Recommendations(inputBuild.input);
              return createVersion2RecommendationSessionPayload(
                assessmentDraft,
                inputBuild.input,
                recommendationResult,
              );
            })()
          : createRecommendationSessionPayload(
              assessmentDraft,
              buildResult.profile,
              generateRecommendations(buildResult.profile),
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

  if (activeMode === null) {
    return (
      <div className="mx-auto w-full max-w-5xl" aria-live="polite">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-teal-700">
            Preparing your assessment…
          </p>
        </div>
      </div>
    );
  }

  const activeModeTitle =
    activeMode === "legacy"
      ? "Version 1 assessment"
      : assessmentModeMetadata[activeMode].title;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-950 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold">Selected mode:</span> {activeModeTitle}
          {activeMode !== "legacy" && (
            <span className="text-teal-800">
              {activeMode === "quick"
                ? " · Quick RIASEC interests and the five-task aptitude exercise are active."
                : " · Detailed RIASEC interests and the five-task aptitude exercise are active."}
            </span>
          )}
        </p>
        <Link
          href="/assessment/mode"
          className="shrink-0 rounded-lg font-bold text-teal-800 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          Change mode
        </Link>
      </div>
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
            activeMode === "quick" ? (
              <QuickInterestStep
                responses={quickInterestResponses}
                onChange={updateQuickInterestResponse}
                onBackToSubjects={() => setCurrentStep(2)}
                onComplete={continueToAptitudeAssessment}
              />
            ) : activeMode === "detailed" ? (
              <DetailedInterestStep
                responses={detailedInterestResponses}
                onAnswer={answerDetailedInterestQuestion}
                onBackToSubjects={() => setCurrentStep(2)}
                onComplete={continueToAptitudeAssessment}
              />
            ) : (
              <InterestStep
                responses={interestResponses}
                onAnswer={answerInterestQuestion}
                onBackToSubjects={() => setCurrentStep(2)}
                onComplete={continueToAptitudeAssessment}
              />
            )
          )}

          {currentStep === 4 && (
            activeMode === "legacy" || usesLegacyAptitude ? (
              <AptitudeStep
                responses={aptitudeResponses}
                onAnswer={answerAptitudeQuestion}
                onBackToInterests={() => setCurrentStep(3)}
                onComplete={continueToReview}
              />
            ) : (
              <BriefAptitudeStep
                responses={briefAptitudeResponses}
                onAnswer={answerBriefAptitudeTask}
                onBackToInterests={() => setCurrentStep(3)}
                onComplete={continueToReview}
              />
            )
          )}

          {currentStep === 5 && studentProfile && (
            <div>
              <ReviewStep
                studentProfile={studentProfile}
                assessmentMode={activeMode}
                quickInterestResult={
                  activeMode === "quick" && quickInterestAssessment.isValid
                    ? quickInterestAssessment
                    : undefined
                }
                detailedInterestResult={
                  activeMode === "detailed" &&
                  detailedInterestAssessment.isValid
                    ? detailedInterestAssessment
                    : undefined
                }
                briefAptitudeResult={
                  activeMode !== "legacy" &&
                  !usesLegacyAptitude &&
                  briefAptitudeAssessment.isValid
                    ? briefAptitudeAssessment
                    : undefined
                }
              />
              <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="secondary-button"
                  >
                    <span aria-hidden="true" className="mr-2">
                      ←
                    </span>
                    Edit interest answers
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="secondary-button"
                  >
                    Edit aptitude answers
                  </button>
                </div>
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
