import { aptitudeQuestions } from "../data/aptitude-questions";
import { interestQuestions } from "../data/interest-questions";
import { programs } from "../data/programs";
import type { RecommendationEngineResult } from "./recommendation-engine";
import {
  buildStudentProfile,
  type CompletedAssessmentData,
} from "./assessment-to-student-profile";
import {
  toSubjectMarks,
  validateSubjectMarkRows,
  type SubjectMarkDraft,
} from "./assessment-form";
import type { AptitudeResponses } from "./aptitude-assessment";
import type { InterestResponses } from "./interest-assessment";
import type { IntermediateGroup } from "../types/program";
import type { RecommendationResult } from "../types/recommendation";
import type { StudentProfile } from "../types/student";

export const ASSESSMENT_DRAFT_SESSION_KEY =
  "sibau-degree-advisor:assessment-draft:v1";
export const RECOMMENDATION_SESSION_KEY =
  "sibau-degree-advisor:recommendations:v1";

export interface AssessmentSessionDraft {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectRows: SubjectMarkDraft[];
  interestResponses: InterestResponses;
  aptitudeResponses: AptitudeResponses;
}

export interface RecommendationSessionPayload {
  version: 1;
  createdAt: string;
  assessmentDraft: AssessmentSessionDraft;
  studentProfile: StudentProfile;
  recommendationResult: RecommendationEngineResult;
}

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
  const completedAssessment: CompletedAssessmentData = {
    name: value.name,
    intermediateGroup: value.intermediateGroup as IntermediateGroup,
    subjectMarks: toSubjectMarks(value.subjectRows),
    interestResponses: value.interestResponses,
    aptitudeResponses: value.aptitudeResponses,
  };

  return (
    subjectValidation.isValid && buildStudentProfile(completedAssessment).isValid
  );
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
    isStringArray(value.improvementAreas)
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

export function createRecommendationSessionPayload(
  assessmentDraft: AssessmentSessionDraft,
  studentProfile: StudentProfile,
  recommendationResult: RecommendationEngineResult,
): RecommendationSessionPayload {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    assessmentDraft,
    studentProfile,
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
      value.version !== 1 ||
      typeof value.createdAt !== "string" ||
      Number.isNaN(Date.parse(value.createdAt)) ||
      !isAssessmentSessionDraft(value.assessmentDraft) ||
      !isRecommendationEngineResult(value.recommendationResult)
    ) {
      return null;
    }

    const rebuilt = buildStudentProfile({
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

    return value as unknown as RecommendationSessionPayload;
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
