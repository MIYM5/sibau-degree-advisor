import type { AssessmentFeedback } from "./assessment-feedback";
import type {
  BriefAptitudeDimension,
  BriefAptitudeResponse,
  BriefAptitudeTaskId,
} from "./brief-aptitude";
import type { ConsentRecord } from "./consent";
import type { DetailedRiasecResponse } from "./detailed-interest";
import type { IntermediateGroup, ProgramId, Subject } from "./program";
import type { QuickInterestResponse } from "./quick-interest";
import type {
  EligibilityStatus,
  QuestionnaireVersion,
  RecommendationBand,
  RecommendationConfidence,
  ScoringModelVersion,
} from "./recommendation";
import type { HollandCode, RiasecScores } from "./riasec";

export const RESEARCH_SUBMISSION_SCHEMA_VERSION = 1 as const;
export const RESEARCH_ASSESSMENT_VERSION = "version-2-research-v1" as const;
export const RESEARCH_PROGRAM_DATA_VERSION = "sibau-program-data-v1" as const;

export interface ResearchSubjectMark {
  subject: Subject;
  obtainedMarks: number;
  totalMarks: number;
  calculatedPercentage: number;
}

export interface ResearchRiasecResult {
  scores: RiasecScores;
  topThreeCode: HollandCode;
  evidenceLabel: "Preliminary" | "Stronger interest evidence";
}

export interface ResearchAptitudeResult {
  correctCount: number;
  totalTasks: number;
  overallPercentage: number;
  evidenceLabel: "Limited";
}

export interface ResearchRecommendationResult {
  programId: ProgramId;
  eligibilityStatus: EligibilityStatus;
  academicScore: number;
  interestScore: number;
  aptitudeScore: number;
  finalScore: number;
  rank: number | null;
  recommendationBand: RecommendationBand;
  confidence: RecommendationConfidence;
  institutionalFitWarning: boolean;
}

/**
 * Procedure evidence is intentionally explicit and separate from the checkbox.
 * The current governance engine still does not mark minors storage-eligible;
 * these fields prepare validation for a separately approved future procedure.
 */
export interface MinorProcedureEvidence {
  guardianConsentCompleted: true;
  minorAssentCompleted: true;
  procedureVersion: string;
  recordedAt: string;
}

interface ResearchSubmissionBase {
  schemaVersion: typeof RESEARCH_SUBMISSION_SCHEMA_VERSION;
  submissionId: string;
  participantAnonymousId: string;
  consent: ConsentRecord;
  ageGroup: ConsentRecord["ageGroup"];
  intermediateGroup: IntermediateGroup;
  subjectMarks: ResearchSubjectMark[];
  overallPercentage: number;
  riasecResult: ResearchRiasecResult;
  briefAptitudeResponses: BriefAptitudeResponse[];
  aptitudeResult: ResearchAptitudeResult;
  recommendationResults: ResearchRecommendationResult[];
  assessmentVersion: typeof RESEARCH_ASSESSMENT_VERSION;
  programDataVersion: typeof RESEARCH_PROGRAM_DATA_VERSION;
  startedAt: string | null;
  completedAt: string;
  completionSeconds: number | null;
  minorProcedureEvidence: MinorProcedureEvidence | null;
  optionalFeedback: AssessmentFeedback | null;
}

export interface QuickResearchSubmission extends ResearchSubmissionBase {
  assessmentMode: "quick";
  interestResponses: QuickInterestResponse[];
  scoringModelVersion: Extract<
    ScoringModelVersion,
    "version-2-quick-55-30-15"
  >;
  questionnaireVersion: Extract<
    QuestionnaireVersion,
    "version-2-quick-riasec-v1-brief-aptitude-v1"
  >;
}

export interface DetailedResearchSubmission extends ResearchSubmissionBase {
  assessmentMode: "detailed";
  interestResponses: DetailedRiasecResponse[];
  scoringModelVersion: Extract<
    ScoringModelVersion,
    "version-2-detailed-50-35-15"
  >;
  questionnaireVersion: Extract<
    QuestionnaireVersion,
    "version-2-detailed-riasec-v1-brief-aptitude-v1"
  >;
}

export type ResearchSubmission =
  | QuickResearchSubmission
  | DetailedResearchSubmission;

export interface ResearchSubmissionValidationIssue {
  code: string;
  field: string;
}

export type ResearchSubmissionValidationResult =
  | {
      isValid: true;
      submission: ResearchSubmission;
      issues: [];
    }
  | {
      isValid: false;
      submission: null;
      issues: ResearchSubmissionValidationIssue[];
    };

export interface ResearchInterestDatabaseRow {
  questionOrScenarioId: string;
  responsePayload: Record<string, unknown>;
  dimension: string | null;
  displayOrder: number;
}

export interface ResearchAptitudeDatabaseRow {
  taskId: BriefAptitudeTaskId;
  dimension: BriefAptitudeDimension;
  selectedChoiceId: string;
  correct: boolean;
  displayOrder: number;
}

export interface ResearchDatabaseSubmission {
  submission: ResearchSubmission;
  participantEligibility: "eligible_adult_with_consent";
  interestRows: ResearchInterestDatabaseRow[];
  aptitudeRows: ResearchAptitudeDatabaseRow[];
}
