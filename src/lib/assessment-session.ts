import { aptitudeQuestions } from "../data/aptitude-questions";
import { interestQuestions } from "../data/interest-questions";
import { programs } from "../data/programs";
import {
  generateVersion2Recommendations,
  type RecommendationEngineResult,
  type Version2RecommendationEngineResult,
} from "./recommendation-engine";
import {
  buildVersion2RecommendationInput,
  buildDetailedStudentProfile,
  buildQuickStudentProfile,
  buildStudentProfile,
  buildVersion2StudentProfile,
  type CompletedAssessmentData,
} from "./assessment-to-student-profile";
import {
  toSubjectMarks,
  validateSubjectMarkRows,
  type SubjectMarkDraft,
} from "./assessment-form";
import type { AptitudeResponses } from "./aptitude-assessment";
import type { InterestResponses } from "./interest-assessment";
import { calculateBriefAptitudeAssessment } from "./brief-aptitude-assessment";
import { calculateDetailedRiasecAssessment } from "./detailed-riasec-assessment";
import { calculateQuickInterestAssessment } from "./quick-interest-assessment";
import type { DetailedRiasecResponse } from "../types/detailed-interest";
import type { BriefAptitudeResponse } from "../types/brief-aptitude";
import type { IntermediateGroup } from "../types/program";
import type { QuickInterestResponse } from "../types/quick-interest";
import type {
  RecommendationResult,
  Version2RecommendationInput,
} from "../types/recommendation";
import type { StudentProfile } from "../types/student";

export const ASSESSMENT_DRAFT_SESSION_KEY =
  "sibau-degree-advisor:assessment-draft:v1";
export const RECOMMENDATION_SESSION_KEY =
  "sibau-degree-advisor:recommendations:v1";

export interface AssessmentSessionDraft {
  schemaVersion?: 2;
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectRows: SubjectMarkDraft[];
  interestResponses: InterestResponses;
  aptitudeResponses: AptitudeResponses;
  quickInterestResponses?: QuickInterestResponse[];
  detailedInterestResponses?: DetailedRiasecResponse[];
  briefAptitudeResponses?: BriefAptitudeResponse[];
}

interface RecommendationSessionPayloadBase {
  createdAt: string;
  assessmentDraft: AssessmentSessionDraft;
}

export interface Version1RecommendationSessionPayload
  extends RecommendationSessionPayloadBase {
  version: 1;
  studentProfile: StudentProfile;
  recommendationResult: RecommendationEngineResult;
}

export interface Version2RecommendationSessionPayload
  extends RecommendationSessionPayloadBase {
  version: 2;
  recommendationInput: Version2RecommendationInput;
  recommendationResult: Version2RecommendationEngineResult;
}

export type RecommendationSessionPayload =
  | Version1RecommendationSessionPayload
  | Version2RecommendationSessionPayload;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const programIds = new Set(programs.map(({ id }) => id));
const interestQuestionIds = new Set(interestQuestions.map(({ id }) => id));
const aptitudeQuestionIds = new Set(aptitudeQuestions.map(({ id }) => id));

function isResponseRecord(
  value: unknown,
  allowedIds: ReadonlySet<string>,
): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([id, response]) =>
        allowedIds.has(id) &&
        isFiniteNumber(response) &&
        Number.isInteger(response) &&
        response >= 1 &&
        response <= 5,
    )
  );
}

function isSubjectMarkDraft(value: unknown): value is SubjectMarkDraft {
  if (!isRecord(value) || typeof value.isOptional !== "boolean") return false;
  if (value.subject !== undefined && typeof value.subject !== "string") {
    return false;
  }
  for (const field of [
    "obtainedMarks",
    "totalMarks",
    "calculatedPercentage",
  ] as const) {
    if (value[field] !== undefined && !isFiniteNumber(value[field])) return false;
  }
  return true;
}

export function isAssessmentSessionDraft(
  value: unknown,
): value is AssessmentSessionDraft {
  if (
    !isRecord(value) ||
    (value.schemaVersion !== undefined && value.schemaVersion !== 2) ||
    typeof value.name !== "string" ||
    typeof value.intermediateGroup !== "string" ||
    !Array.isArray(value.subjectRows) ||
    !value.subjectRows.every(isSubjectMarkDraft) ||
    !isResponseRecord(value.interestResponses, interestQuestionIds) ||
    !isResponseRecord(value.aptitudeResponses, aptitudeQuestionIds)
  ) {
    return false;
  }

  const subjectValidation = validateSubjectMarkRows(value.subjectRows);
  const quickInterestAssessment =
    value.quickInterestResponses === undefined
      ? null
      : calculateQuickInterestAssessment(value.quickInterestResponses);
  const detailedInterestAssessment =
    value.detailedInterestResponses === undefined
      ? null
      : calculateDetailedRiasecAssessment(value.detailedInterestResponses);
  const briefAptitudeAssessment =
    value.briefAptitudeResponses === undefined
      ? null
      : calculateBriefAptitudeAssessment(value.briefAptitudeResponses);
  if (quickInterestAssessment && !quickInterestAssessment.isValid) return false;
  if (detailedInterestAssessment && !detailedInterestAssessment.isValid) {
    return false;
  }
  if (briefAptitudeAssessment && !briefAptitudeAssessment.isValid) return false;
  if (quickInterestAssessment && detailedInterestAssessment) return false;
  if (briefAptitudeAssessment && value.schemaVersion !== 2) return false;
  if (value.schemaVersion === 2 && !briefAptitudeAssessment) return false;
  if (
    briefAptitudeAssessment &&
    Number(Boolean(quickInterestAssessment)) +
      Number(Boolean(detailedInterestAssessment)) !==
      1
  ) {
    return false;
  }

  const completedAssessment: CompletedAssessmentData = {
    name: value.name,
    intermediateGroup: value.intermediateGroup as IntermediateGroup,
    subjectMarks: toSubjectMarks(value.subjectRows),
    interestResponses: value.interestResponses,
    aptitudeResponses: value.aptitudeResponses,
  };

  const reviewOnlyProfileData = {
    name: value.name,
    intermediateGroup: value.intermediateGroup as IntermediateGroup,
    subjectMarks: toSubjectMarks(value.subjectRows),
    aptitudeResponses: value.aptitudeResponses,
  };
  const profileBuild = briefAptitudeAssessment
    ? buildVersion2StudentProfile({
        name: value.name,
        intermediateGroup: value.intermediateGroup as IntermediateGroup,
        subjectMarks: toSubjectMarks(value.subjectRows),
        briefAptitudeResponses: briefAptitudeAssessment.responses,
      })
    : quickInterestAssessment
      ? buildQuickStudentProfile(reviewOnlyProfileData)
      : detailedInterestAssessment
        ? buildDetailedStudentProfile(reviewOnlyProfileData)
        : buildStudentProfile(completedAssessment);

  return subjectValidation.isValid && profileBuild.isValid;
}

function isRecommendationResult(value: unknown): value is RecommendationResult {
  if (!isRecord(value)) return false;
  const status = value.eligibilityStatus;
  const validStatus =
    status === "Eligible" ||
    status === "Not eligible" ||
    status === "Verification required";
  const validRank =
    status === "Eligible"
      ? Number.isInteger(value.rank) && Number(value.rank) > 0
      : value.rank === null;

  return (
    typeof value.programId === "string" &&
    programIds.has(value.programId as (typeof programs)[number]["id"]) &&
    typeof value.programName === "string" &&
    validStatus &&
    validRank &&
    [
      value.academicScore,
      value.interestScore,
      value.aptitudeScore,
      value.finalScore,
    ].every((score) => isFiniteNumber(score) && score >= 0 && score <= 100) &&
    isFiniteNumber(value.evidenceCoverage) &&
    value.evidenceCoverage >= 0 &&
    value.evidenceCoverage <= 1 &&
    [
      "Excellent Match",
      "Strong Match",
      "Good Match",
      "Moderate Match",
      "Weak Match",
    ].includes(String(value.recommendationBand)) &&
    ["High", "Medium", "Low"].includes(String(value.confidence)) &&
    isStringArray(value.reasons) &&
    isStringArray(value.improvementAreas) &&
    (value.confidenceNotes === undefined ||
      isStringArray(value.confidenceNotes))
  );
}

function isRecommendationEngineResult(
  value: unknown,
): value is RecommendationEngineResult {
  if (!isRecord(value)) return false;
  const recommendations = value.recommendations;
  const eligible = value.eligibleRecommendations;
  const topFive = value.topFiveEligibleRecommendations;
  const verification = value.verificationRequired;
  const notEligible = value.notEligible;
  const warnings = value.institutionalFitWarnings;

  return (
    Array.isArray(recommendations) &&
    recommendations.every(isRecommendationResult) &&
    Array.isArray(eligible) &&
    eligible.every(
      (item) =>
        isRecommendationResult(item) && item.eligibilityStatus === "Eligible",
    ) &&
    Array.isArray(topFive) &&
    topFive.length <= 5 &&
    topFive.every(
      (item) =>
        isRecommendationResult(item) && item.eligibilityStatus === "Eligible",
    ) &&
    Array.isArray(verification) &&
    verification.every(
      (item) =>
        isRecommendationResult(item) &&
        item.eligibilityStatus === "Verification required",
    ) &&
    Array.isArray(notEligible) &&
    notEligible.every(
      (item) =>
        isRecommendationResult(item) && item.eligibilityStatus === "Not eligible",
    ) &&
    Array.isArray(warnings) &&
    warnings.every(
      (warning) =>
        isRecord(warning) &&
        typeof warning.code === "string" &&
        typeof warning.message === "string",
    )
  );
}

function isVersion2RecommendationEngineResult(
  value: unknown,
): value is Version2RecommendationEngineResult {
  if (!isRecommendationEngineResult(value) || !isRecord(value)) return false;
  if (value.version !== 2) return false;
  if (value.assessmentMode !== "quick" && value.assessmentMode !== "detailed") {
    return false;
  }
  const mode = value.assessmentMode;
  const expectedScoringModel =
    mode === "quick"
      ? "version-2-quick-55-30-15"
      : "version-2-detailed-50-35-15";
  const expectedQuestionnaire =
    mode === "quick"
      ? "version-2-quick-riasec-v1-brief-aptitude-v1"
      : "version-2-detailed-riasec-v1-brief-aptitude-v1";
  const expectedRiasecLabel =
    mode === "quick" ? "Preliminary" : "Stronger interest evidence";
  const weights = value.componentWeights;

  return (
    value.scoringModelVersion === expectedScoringModel &&
    value.questionnaireVersion === expectedQuestionnaire &&
    value.riasecEvidenceLabel === expectedRiasecLabel &&
    value.aptitudeEvidenceLabel === "Limited" &&
    isRecord(weights) &&
    isFiniteNumber(weights.academic) &&
    isFiniteNumber(weights.interest) &&
    isFiniteNumber(weights.aptitude) &&
    weights.academic === (mode === "quick" ? 0.55 : 0.5) &&
    weights.interest === (mode === "quick" ? 0.3 : 0.35) &&
    weights.aptitude === 0.15
  );
}

export function createRecommendationSessionPayload(
  assessmentDraft: AssessmentSessionDraft,
  studentProfile: StudentProfile,
  recommendationResult: RecommendationEngineResult,
): Version1RecommendationSessionPayload {
  if (assessmentDraft.schemaVersion === 2) {
    throw new RangeError(
      "Version 2 drafts require createVersion2RecommendationSessionPayload.",
    );
  }
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    assessmentDraft,
    studentProfile,
    recommendationResult,
  };
}

export function createVersion2RecommendationSessionPayload(
  assessmentDraft: AssessmentSessionDraft,
  recommendationInput: Version2RecommendationInput,
  recommendationResult: Version2RecommendationEngineResult,
): Version2RecommendationSessionPayload {
  if (assessmentDraft.schemaVersion !== 2) {
    throw new RangeError("A Version 2 draft is required.");
  }
  if (
    recommendationInput.assessmentMode !==
      recommendationResult.assessmentMode ||
    recommendationInput.scoringModelVersion !==
      recommendationResult.scoringModelVersion ||
    recommendationInput.questionnaireVersion !==
      recommendationResult.questionnaireVersion
  ) {
    throw new RangeError(
      "Version 2 recommendation input and result metadata do not match.",
    );
  }

  return {
    version: 2,
    createdAt: new Date().toISOString(),
    assessmentDraft,
    recommendationInput,
    recommendationResult,
  };
}

export function parseRecommendationSessionPayload(
  serialized: string | null,
): RecommendationSessionPayload | null {
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    if (
      !isRecord(value) ||
      (value.version !== 1 && value.version !== 2) ||
      typeof value.createdAt !== "string" ||
      Number.isNaN(Date.parse(value.createdAt)) ||
      !isAssessmentSessionDraft(value.assessmentDraft)
    ) {
      return null;
    }

    if (value.version === 2) {
      if (
        value.assessmentDraft.schemaVersion !== 2 ||
        !isVersion2RecommendationEngineResult(value.recommendationResult) ||
        !isRecord(value.recommendationInput)
      ) {
        return null;
      }
      const draft = value.assessmentDraft;
      const rebuilt = draft.quickInterestResponses
        ? buildVersion2RecommendationInput({
            assessmentMode: "quick",
            name: draft.name,
            intermediateGroup: draft.intermediateGroup,
            subjectMarks: toSubjectMarks(draft.subjectRows),
            quickInterestResponses: draft.quickInterestResponses,
            briefAptitudeResponses: draft.briefAptitudeResponses ?? [],
          })
        : draft.detailedInterestResponses
          ? buildVersion2RecommendationInput({
              assessmentMode: "detailed",
              name: draft.name,
              intermediateGroup: draft.intermediateGroup,
              subjectMarks: toSubjectMarks(draft.subjectRows),
              detailedInterestResponses: draft.detailedInterestResponses,
              briefAptitudeResponses: draft.briefAptitudeResponses ?? [],
            })
          : null;
      if (
        !rebuilt?.isValid ||
        JSON.stringify(rebuilt.input) !==
          JSON.stringify(value.recommendationInput)
      ) {
        return null;
      }
      const regenerated = generateVersion2Recommendations(rebuilt.input);
      if (
        JSON.stringify(regenerated) !==
        JSON.stringify(value.recommendationResult)
      ) {
        return null;
      }
      return value as unknown as Version2RecommendationSessionPayload;
    }

    if (
      value.assessmentDraft.schemaVersion === 2 ||
      !isRecommendationEngineResult(value.recommendationResult)
    ) {
      return null;
    }

    const reviewOnlyProfileData = {
      name: value.assessmentDraft.name,
      intermediateGroup: value.assessmentDraft.intermediateGroup,
      subjectMarks: toSubjectMarks(value.assessmentDraft.subjectRows),
      aptitudeResponses: value.assessmentDraft.aptitudeResponses,
    };
    const rebuilt = value.assessmentDraft.quickInterestResponses
        ? buildQuickStudentProfile(reviewOnlyProfileData)
        : value.assessmentDraft.detailedInterestResponses
          ? buildDetailedStudentProfile(reviewOnlyProfileData)
          : buildStudentProfile({
              name: value.assessmentDraft.name,
              intermediateGroup: value.assessmentDraft.intermediateGroup,
              subjectMarks: toSubjectMarks(value.assessmentDraft.subjectRows),
              interestResponses: value.assessmentDraft.interestResponses,
              aptitudeResponses: value.assessmentDraft.aptitudeResponses,
            });
    if (
      !rebuilt.isValid ||
      JSON.stringify(rebuilt.profile) !== JSON.stringify(value.studentProfile)
    ) {
      return null;
    }

    return value as unknown as Version1RecommendationSessionPayload;
  } catch {
    return null;
  }
}

export function parseAssessmentSessionDraft(
  serialized: string | null,
): AssessmentSessionDraft | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    return isAssessmentSessionDraft(value) ? value : null;
  } catch {
    return null;
  }
}
