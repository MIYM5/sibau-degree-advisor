import { briefAptitudeTasks } from "../data/brief-aptitude-tasks";
import { detailedRiasecQuestions } from "../data/detailed-riasec-questions";
import { programs } from "../data/programs";
import { quickInterestScenarios } from "../data/quick-interest-scenarios";
import { validateAssessmentFeedback } from "./assessment-feedback";
import { buildVersion2RecommendationInput } from "./assessment-to-student-profile";
import { calculateBriefAptitudeAssessment } from "./brief-aptitude-assessment";
import { validateConsentRecord } from "./consent-session";
import { calculateDetailedRiasecAssessment } from "./detailed-riasec-assessment";
import { calculateQuickInterestAssessment } from "./quick-interest-assessment";
import { generateVersion2Recommendations } from "./recommendation-engine";
import { determineResearchParticipantEligibility } from "./research-governance";
import { availableSubjects, intermediateGroups } from "./assessment-form";
import type { ResearchGovernanceValidationResult } from "../types/research-governance";
import {
  RESEARCH_ASSESSMENT_VERSION,
  RESEARCH_PROGRAM_DATA_VERSION,
  RESEARCH_SUBMISSION_SCHEMA_VERSION,
  type ResearchDatabaseSubmission,
  type ResearchRecommendationResult,
  type ResearchSubmission,
  type ResearchSubmissionValidationIssue,
  type ResearchSubmissionValidationResult,
} from "../types/research-submission";
import { riasecDimensionOrder } from "../types/riasec";

export const MAX_RESEARCH_SUBMISSION_BYTES = 256 * 1024;

interface ValidationOptions {
  existingSubmissionIds?: ReadonlySet<string>;
}

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface ResearchDatabaseConfigStatus {
  isConfigured: boolean;
  issues: readonly ("missing_supabase_url" | "invalid_supabase_url" | "missing_service_role_key")[];
}

const topLevelFields = new Set([
  "schemaVersion",
  "submissionId",
  "participantAnonymousId",
  "consent",
  "assessmentMode",
  "ageGroup",
  "intermediateGroup",
  "subjectMarks",
  "overallPercentage",
  "interestResponses",
  "riasecResult",
  "briefAptitudeResponses",
  "aptitudeResult",
  "recommendationResults",
  "assessmentVersion",
  "questionnaireVersion",
  "scoringModelVersion",
  "programDataVersion",
  "startedAt",
  "completedAt",
  "completionSeconds",
  "minorProcedureEvidence",
  "optionalFeedback",
]);
const programIds = new Set(programs.map(({ id }) => id));
const validEligibilityStatuses = new Set([
  "Eligible",
  "Not eligible",
  "Verification required",
]);
const validRecommendationBands = new Set([
  "Excellent Match",
  "Strong Match",
  "Good Match",
  "Moderate Match",
  "Weak Match",
]);
const validConfidence = new Set(["High", "Medium", "Low"]);
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function score(value: unknown): value is number {
  return finiteNumber(value) && value >= 0 && value <= 100;
}

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.000001;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function onlyFields(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  const allowed = new Set(fields);
  return Object.keys(value).every((field) => allowed.has(field));
}

function addIssue(
  issues: ResearchSubmissionValidationIssue[],
  code: string,
  field: string,
): void {
  if (!issues.some((item) => item.code === code && item.field === field)) {
    issues.push({ code, field });
  }
}

export function validateResearchDatabaseConfig(
  environment: EnvironmentSource,
): ResearchDatabaseConfigStatus {
  const issues: ResearchDatabaseConfigStatus["issues"][number][] = [];
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) {
    issues.push("missing_supabase_url");
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        issues.push("invalid_supabase_url");
      }
    } catch {
      issues.push("invalid_supabase_url");
    }
  }
  if (!serviceRoleKey) issues.push("missing_service_role_key");
  return { isConfigured: issues.length === 0, issues };
}

function validateSubjectMarks(
  value: unknown,
  issues: ResearchSubmissionValidationIssue[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    addIssue(issues, "invalid_subject_marks", "subjectMarks");
    return;
  }
  const seen = new Set<string>();
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !onlyFields(candidate, [
        "subject",
        "obtainedMarks",
        "totalMarks",
        "calculatedPercentage",
      ])
    ) {
      addIssue(issues, "invalid_subject_marks", "subjectMarks");
      continue;
    }
    if (
      typeof candidate.subject !== "string" ||
      !availableSubjects.includes(candidate.subject as never)
    ) {
      addIssue(issues, "unknown_subject", "subjectMarks");
    } else if (seen.has(candidate.subject.toLowerCase())) {
      addIssue(issues, "duplicate_subject", "subjectMarks");
    } else {
      seen.add(candidate.subject.toLowerCase());
    }
    if (
      !finiteNumber(candidate.obtainedMarks) ||
      !finiteNumber(candidate.totalMarks) ||
      !score(candidate.calculatedPercentage) ||
      candidate.totalMarks <= 0 ||
      candidate.obtainedMarks < 0 ||
      candidate.obtainedMarks > candidate.totalMarks
    ) {
      addIssue(issues, "invalid_subject_marks", "subjectMarks");
      continue;
    }
    const expected = (candidate.obtainedMarks / candidate.totalMarks) * 100;
    if (!sameNumber(expected, candidate.calculatedPercentage)) {
      addIssue(issues, "inconsistent_subject_percentage", "subjectMarks");
    }
  }
}

function validateInterestResponses(
  mode: unknown,
  value: unknown,
  issues: ResearchSubmissionValidationIssue[],
): ReturnType<typeof calculateQuickInterestAssessment> | ReturnType<typeof calculateDetailedRiasecAssessment> | null {
  if (!Array.isArray(value)) {
    addIssue(issues, "missing_interest_responses", "interestResponses");
    return null;
  }
  const fields =
    mode === "quick"
      ? [
          "scenarioId",
          "mostPreferredChoiceId",
          "secondPreferredChoiceId",
          "leastPreferredChoiceId",
        ]
      : ["questionId", "value"];
  if (value.some((item) => !isRecord(item) || !onlyFields(item, fields))) {
    addIssue(issues, "invalid_interest_response", "interestResponses");
  }
  const result =
    mode === "quick"
      ? calculateQuickInterestAssessment(value)
      : mode === "detailed"
        ? calculateDetailedRiasecAssessment(value)
        : null;
  if (!result?.isValid) {
    const duplicate = result?.errors.some((item) =>
      item.code.includes("duplicate"),
    );
    addIssue(
      issues,
      duplicate ? "duplicate_interest_response" : "invalid_interest_responses",
      "interestResponses",
    );
  }
  return result;
}

function validateRiasecResult(
  value: unknown,
  calculated: ReturnType<typeof calculateQuickInterestAssessment> | ReturnType<typeof calculateDetailedRiasecAssessment> | null,
  issues: ResearchSubmissionValidationIssue[],
): void {
  if (
    !isRecord(value) ||
    !onlyFields(value, ["scores", "topThreeCode", "evidenceLabel"]) ||
    !isRecord(value.scores) ||
    !onlyFields(value.scores, [...riasecDimensionOrder])
  ) {
    addIssue(issues, "invalid_riasec_result", "riasecResult");
    return;
  }
  const missing = riasecDimensionOrder.some(
    (dimension) => !(dimension in (value.scores as Record<string, unknown>)),
  );
  if (missing) addIssue(issues, "missing_riasec_dimension", "riasecResult.scores");
  for (const dimension of riasecDimensionOrder) {
    const provided = value.scores[dimension];
    if (!score(provided)) {
      addIssue(issues, "invalid_riasec_score", `riasecResult.scores.${dimension}`);
    } else if (calculated?.isValid && !sameNumber(provided, calculated.scores[dimension])) {
      addIssue(issues, "inconsistent_riasec_score", `riasecResult.scores.${dimension}`);
    }
  }
  if (
    calculated?.isValid &&
    (value.topThreeCode !== calculated.profile?.hollandCode ||
      value.evidenceLabel !== calculated.evidenceLabel)
  ) {
    addIssue(issues, "inconsistent_riasec_result", "riasecResult");
  }
}

function validateAptitude(
  responses: unknown,
  providedResult: unknown,
  issues: ResearchSubmissionValidationIssue[],
): ReturnType<typeof calculateBriefAptitudeAssessment> {
  if (
    !Array.isArray(responses) ||
    responses.some(
      (item) =>
        !isRecord(item) ||
        !onlyFields(item, ["taskId", "selectedChoiceId"]),
    )
  ) {
    addIssue(issues, "invalid_aptitude_responses", "briefAptitudeResponses");
  }
  const calculated = calculateBriefAptitudeAssessment(responses);
  if (!calculated.isValid) {
    const duplicate = calculated.errors.some(
      (item) => item.code === "duplicate_task_response",
    );
    addIssue(
      issues,
      duplicate ? "duplicate_aptitude_response" : "invalid_aptitude_responses",
      "briefAptitudeResponses",
    );
  }
  if (
    !isRecord(providedResult) ||
    !onlyFields(providedResult, [
      "correctCount",
      "totalTasks",
      "overallPercentage",
      "evidenceLabel",
    ]) ||
    !Number.isInteger(providedResult.correctCount) ||
    !Number.isInteger(providedResult.totalTasks) ||
    !score(providedResult.overallPercentage) ||
    providedResult.evidenceLabel !== "Limited"
  ) {
    addIssue(issues, "invalid_aptitude_result", "aptitudeResult");
  } else if (
    calculated.isValid &&
    (providedResult.correctCount !== calculated.totalCorrect ||
      providedResult.totalTasks !== calculated.totalTasks ||
      !sameNumber(providedResult.overallPercentage, calculated.overallPercentage))
  ) {
    addIssue(issues, "inconsistent_aptitude_result", "aptitudeResult");
  }
  return calculated;
}

function validateRecommendations(
  value: unknown,
  generated: ReturnType<typeof generateVersion2Recommendations> | null,
  issues: ResearchSubmissionValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    addIssue(issues, "invalid_recommendation_results", "recommendationResults");
    return;
  }
  if (value.length !== programs.length) {
    addIssue(issues, "invalid_recommendation_count", "recommendationResults");
  }
  const seen = new Set<string>();
  const generatedByProgram = new Map(
    generated?.recommendations.map((item) => [item.programId, item]) ?? [],
  );
  const expectedWarning = (generated?.institutionalFitWarnings.length ?? 0) > 0;
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !onlyFields(candidate, [
        "programId",
        "eligibilityStatus",
        "academicScore",
        "interestScore",
        "aptitudeScore",
        "finalScore",
        "rank",
        "recommendationBand",
        "confidence",
        "institutionalFitWarning",
      ])
    ) {
      addIssue(issues, "invalid_recommendation_result", "recommendationResults");
      continue;
    }
    if (typeof candidate.programId !== "string" || !programIds.has(candidate.programId as never)) {
      addIssue(issues, "unknown_program_id", "recommendationResults");
      continue;
    }
    if (seen.has(candidate.programId)) {
      addIssue(issues, "duplicate_recommendation_program", "recommendationResults");
    }
    seen.add(candidate.programId);
    if (!validEligibilityStatuses.has(String(candidate.eligibilityStatus))) {
      addIssue(issues, "invalid_recommendation_classification", "recommendationResults");
    }
    if (candidate.eligibilityStatus === "Eligible") {
      if (!Number.isInteger(candidate.rank) || Number(candidate.rank) <= 0) {
        addIssue(issues, "eligible_result_missing_rank", "recommendationResults");
      }
    } else if (candidate.rank !== null) {
      addIssue(issues, "unranked_result_has_rank", "recommendationResults");
    }
    if (
      ![
        candidate.academicScore,
        candidate.interestScore,
        candidate.aptitudeScore,
        candidate.finalScore,
      ].every(score) ||
      !validRecommendationBands.has(String(candidate.recommendationBand)) ||
      !validConfidence.has(String(candidate.confidence)) ||
      typeof candidate.institutionalFitWarning !== "boolean"
    ) {
      addIssue(issues, "invalid_recommendation_result", "recommendationResults");
    }

    const expected = generatedByProgram.get(candidate.programId as never);
    if (
      expected &&
      (candidate.eligibilityStatus !== expected.eligibilityStatus ||
        candidate.rank !== expected.rank ||
        !sameNumber(Number(candidate.academicScore), expected.academicScore) ||
        !sameNumber(Number(candidate.interestScore), expected.interestScore) ||
        !sameNumber(Number(candidate.aptitudeScore), expected.aptitudeScore) ||
        !sameNumber(Number(candidate.finalScore), expected.finalScore) ||
        candidate.recommendationBand !== expected.recommendationBand ||
        candidate.confidence !== expected.confidence ||
        candidate.institutionalFitWarning !== expectedWarning)
    ) {
      addIssue(issues, "inconsistent_recommendation_result", "recommendationResults");
    }
  }
}

function validateMinorProcedureEvidence(
  value: unknown,
  issues: ResearchSubmissionValidationIssue[],
): boolean {
  if (
    !isRecord(value) ||
    !onlyFields(value, [
      "guardianConsentCompleted",
      "minorAssentCompleted",
      "procedureVersion",
      "recordedAt",
    ]) ||
    value.guardianConsentCompleted !== true ||
    value.minorAssentCompleted !== true ||
    typeof value.procedureVersion !== "string" ||
    value.procedureVersion.trim().length === 0 ||
    !isIsoTimestamp(value.recordedAt)
  ) {
    addIssue(
      issues,
      "minor_procedure_evidence_required",
      "minorProcedureEvidence",
    );
    return false;
  }
  return true;
}

export function validateResearchSubmission(
  value: unknown,
  governance: ResearchGovernanceValidationResult,
  options: ValidationOptions = {},
): ResearchSubmissionValidationResult {
  const issues: ResearchSubmissionValidationIssue[] = [];
  if (!isRecord(value)) {
    return {
      isValid: false,
      submission: null,
      issues: [{ code: "malformed_payload", field: "payload" }],
    };
  }
  if (Object.keys(value).some((field) => !topLevelFields.has(field))) {
    addIssue(issues, "unexpected_field", "payload");
  }
  if (value.schemaVersion !== RESEARCH_SUBMISSION_SCHEMA_VERSION) {
    addIssue(issues, "unsupported_schema_version", "schemaVersion");
  }
  if (typeof value.submissionId !== "string" || !UUID_V4_PATTERN.test(value.submissionId)) {
    addIssue(issues, "invalid_submission_id", "submissionId");
  } else if (options.existingSubmissionIds?.has(value.submissionId)) {
    addIssue(issues, "duplicate_submission_id", "submissionId");
  }
  if (
    typeof value.participantAnonymousId !== "string" ||
    !UUID_V4_PATTERN.test(value.participantAnonymousId)
  ) {
    addIssue(issues, "invalid_participant_id", "participantAnonymousId");
  }

  const consentValidation = validateConsentRecord(value.consent);
  if (!consentValidation.isValid || !consentValidation.consent) {
    const operationalMissing = isRecord(value.consent) && value.consent.operationalConsent !== true;
    const researchMissing = isRecord(value.consent) && value.consent.researchConsent !== "granted";
    if (operationalMissing) addIssue(issues, "operational_consent_required", "consent.operationalConsent");
    if (researchMissing) addIssue(issues, "research_consent_required", "consent.researchConsent");
    addIssue(issues, "invalid_consent", "consent");
  } else {
    const consent = consentValidation.consent;
    if (consent.researchConsent !== "granted") {
      addIssue(issues, "research_consent_required", "consent.researchConsent");
    }
    if (value.participantAnonymousId !== consent.participantSessionId) {
      addIssue(issues, "participant_consent_mismatch", "participantAnonymousId");
    }
    if (value.assessmentMode !== consent.assessmentMode || value.ageGroup !== consent.ageGroup) {
      addIssue(issues, "consent_submission_mismatch", "consent");
    }

    const participantEligibility = determineResearchParticipantEligibility(
      {
        ageGroup: consent.ageGroup,
        operationalConsent: consent.operationalConsent,
        researchConsent: consent.researchConsent,
      },
      governance,
    );
    if (consent.ageGroup === "age_18_or_above") {
      if (participantEligibility !== "eligible_adult_with_consent") {
        addIssue(issues, "participant_not_storage_eligible", "consent");
      }
      if (value.minorProcedureEvidence !== null) {
        addIssue(issues, "unexpected_minor_procedure_evidence", "minorProcedureEvidence");
      }
    } else {
      if (governance.status !== "minor_research_ready") {
        addIssue(issues, "minor_governance_not_ready", "consent.ageGroup");
      }
      validateMinorProcedureEvidence(value.minorProcedureEvidence, issues);
      // The approved governance engine has no minor-eligible outcome yet.
      // Configuration and client evidence alone therefore cannot authorize a write.
      if (participantEligibility !== "eligible_adult_with_consent") {
        addIssue(issues, "participant_not_storage_eligible", "consent");
      }
    }
  }

  if (value.assessmentMode !== "quick" && value.assessmentMode !== "detailed") {
    addIssue(issues, "invalid_assessment_mode", "assessmentMode");
  }
  if (value.ageGroup !== "under_16" && value.ageGroup !== "age_16_17" && value.ageGroup !== "age_18_or_above") {
    addIssue(issues, "invalid_age_group", "ageGroup");
  }
  if (typeof value.intermediateGroup !== "string" || !intermediateGroups.includes(value.intermediateGroup as never)) {
    addIssue(issues, "invalid_intermediate_group", "intermediateGroup");
  }
  validateSubjectMarks(value.subjectMarks, issues);
  if (!score(value.overallPercentage)) {
    addIssue(issues, "invalid_overall_percentage", "overallPercentage");
  } else if (Array.isArray(value.subjectMarks)) {
    const validMarks = value.subjectMarks.filter(
      (item): item is Record<string, number> =>
        isRecord(item) &&
        finiteNumber(item.obtainedMarks) &&
        finiteNumber(item.totalMarks) &&
        item.totalMarks > 0,
    );
    const total = validMarks.reduce((sum, item) => sum + item.totalMarks, 0);
    const obtained = validMarks.reduce((sum, item) => sum + item.obtainedMarks, 0);
    if (total <= 0 || !sameNumber(value.overallPercentage, (obtained / total) * 100)) {
      addIssue(issues, "inconsistent_overall_percentage", "overallPercentage");
    }
  }

  const expectedScoring =
    value.assessmentMode === "quick"
      ? "version-2-quick-55-30-15"
      : value.assessmentMode === "detailed"
        ? "version-2-detailed-50-35-15"
        : null;
  const expectedQuestionnaire =
    value.assessmentMode === "quick"
      ? "version-2-quick-riasec-v1-brief-aptitude-v1"
      : value.assessmentMode === "detailed"
        ? "version-2-detailed-riasec-v1-brief-aptitude-v1"
        : null;
  if (value.scoringModelVersion !== expectedScoring) {
    addIssue(issues, "mode_scoring_version_mismatch", "scoringModelVersion");
  }
  if (value.questionnaireVersion !== expectedQuestionnaire) {
    addIssue(issues, "mode_questionnaire_version_mismatch", "questionnaireVersion");
  }
  if (value.assessmentVersion !== RESEARCH_ASSESSMENT_VERSION) {
    addIssue(issues, "invalid_assessment_version", "assessmentVersion");
  }
  if (value.programDataVersion !== RESEARCH_PROGRAM_DATA_VERSION) {
    addIssue(issues, "invalid_program_data_version", "programDataVersion");
  }

  const interestResult = validateInterestResponses(value.assessmentMode, value.interestResponses, issues);
  validateRiasecResult(value.riasecResult, interestResult, issues);
  validateAptitude(value.briefAptitudeResponses, value.aptitudeResult, issues);

  let generated: ReturnType<typeof generateVersion2Recommendations> | null = null;
  if (
    (value.assessmentMode === "quick" || value.assessmentMode === "detailed") &&
    typeof value.intermediateGroup === "string" &&
    Array.isArray(value.subjectMarks) &&
    Array.isArray(value.briefAptitudeResponses) &&
    Array.isArray(value.interestResponses)
  ) {
    const common = {
      name: "Research participant",
      intermediateGroup: value.intermediateGroup as never,
      subjectMarks: value.subjectMarks as never,
      briefAptitudeResponses: value.briefAptitudeResponses as never,
    };
    const built =
      value.assessmentMode === "quick"
        ? buildVersion2RecommendationInput({
            ...common,
            assessmentMode: "quick",
            quickInterestResponses: value.interestResponses as never,
          })
        : buildVersion2RecommendationInput({
            ...common,
            assessmentMode: "detailed",
            detailedInterestResponses: value.interestResponses as never,
          });
    if (built.isValid) {
      generated = generateVersion2Recommendations(built.input);
    }
  }
  validateRecommendations(value.recommendationResults, generated, issues);

  if (!isIsoTimestamp(value.completedAt)) {
    addIssue(issues, "invalid_completed_timestamp", "completedAt");
  }
  if (value.startedAt !== null && !isIsoTimestamp(value.startedAt)) {
    addIssue(issues, "invalid_started_timestamp", "startedAt");
  }
  if (
    value.startedAt !== null &&
    isIsoTimestamp(value.startedAt) &&
    isIsoTimestamp(value.completedAt) &&
    value.startedAt > value.completedAt
  ) {
    addIssue(issues, "invalid_completion_timing", "startedAt");
  }
  if (
    value.completionSeconds !== null &&
    (!Number.isInteger(value.completionSeconds) || Number(value.completionSeconds) < 0)
  ) {
    addIssue(issues, "invalid_completion_duration", "completionSeconds");
  }

  if (value.optionalFeedback !== null) {
    const feedback = validateAssessmentFeedback(value.optionalFeedback);
    if (!feedback.isValid || feedback.feedback?.assessmentMode !== value.assessmentMode) {
      addIssue(issues, "invalid_optional_feedback", "optionalFeedback");
    }
  }

  if (issues.length > 0) return { isValid: false, submission: null, issues };
  return {
    isValid: true,
    submission: value as unknown as ResearchSubmission,
    issues: [],
  };
}

export function parseResearchSubmissionJson(
  serialized: string,
  governance: ResearchGovernanceValidationResult,
  options: ValidationOptions = {},
): ResearchSubmissionValidationResult {
  if (new TextEncoder().encode(serialized).byteLength > MAX_RESEARCH_SUBMISSION_BYTES) {
    return {
      isValid: false,
      submission: null,
      issues: [{ code: "payload_too_large", field: "payload" }],
    };
  }
  try {
    return validateResearchSubmission(JSON.parse(serialized), governance, options);
  } catch {
    return {
      isValid: false,
      submission: null,
      issues: [{ code: "malformed_json", field: "payload" }],
    };
  }
}

export function toResearchDatabaseSubmission(
  submission: ResearchSubmission,
): ResearchDatabaseSubmission {
  const interestRows =
    submission.assessmentMode === "quick"
      ? submission.interestResponses.map((response) => {
          const scenario = quickInterestScenarios.find(
            ({ id }) => id === response.scenarioId,
          )!;
          return {
            questionOrScenarioId: response.scenarioId,
            responsePayload: {
              mostPreferredChoiceId: response.mostPreferredChoiceId,
              secondPreferredChoiceId: response.secondPreferredChoiceId,
              leastPreferredChoiceId: response.leastPreferredChoiceId,
            },
            dimension: null,
            displayOrder: scenario.displayOrder,
          };
        })
      : submission.interestResponses.map((response) => {
          const question = detailedRiasecQuestions.find(
            ({ id }) => id === response.questionId,
          )!;
          return {
            questionOrScenarioId: response.questionId,
            responsePayload: { value: response.value },
            dimension: question.dimension,
            displayOrder: question.displayOrder,
          };
        });
  const aptitude = calculateBriefAptitudeAssessment(
    submission.briefAptitudeResponses,
  );
  const aptitudeRows = aptitude.taskResults.map((result) => ({
    taskId: result.taskId,
    dimension: result.dimension,
    selectedChoiceId: result.selectedChoiceId,
    correct: result.isCorrect,
    displayOrder:
      briefAptitudeTasks.find(({ id }) => id === result.taskId)!.displayOrder,
  }));

  return {
    submission,
    participantEligibility: "eligible_adult_with_consent",
    interestRows,
    aptitudeRows,
  };
}

export function isDuplicateDatabaseError(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

export function sanitizeRecommendationResults(
  results: readonly ResearchRecommendationResult[],
): ResearchRecommendationResult[] {
  return results.map((result) => ({ ...result }));
}
