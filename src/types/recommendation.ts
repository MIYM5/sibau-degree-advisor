import type { ProgramId } from "./program";
import type { AssessmentMode } from "./assessment-mode";
import type { BriefAptitudeAssessmentResult } from "./brief-aptitude";
import type { DetailedRiasecAssessmentResult } from "./detailed-interest";
import type { QuickInterestAssessmentResult } from "./quick-interest";
import type { RiasecEvidenceLabel } from "./riasec";
import type { StudentProfile, SubjectMark } from "./student";

export type EligibilityStatus =
  | "Eligible"
  | "Not eligible"
  | "Verification required";

export type RecommendationBand =
  | "Excellent Match"
  | "Strong Match"
  | "Good Match"
  | "Moderate Match"
  | "Weak Match";

export type RecommendationConfidence = "High" | "Medium" | "Low";

export type MeaningfulDifferenceLabel =
  | "Approximately equal match"
  | "Moderately stronger match"
  | "Clearly stronger match";

export interface RecommendationScoreComparison {
  difference: number;
  label: MeaningfulDifferenceLabel;
}

export type ScoringModelVersion =
  | "version-1-custom-50-30-20"
  | "version-2-quick-55-30-15"
  | "version-2-detailed-50-35-15";

export type QuestionnaireVersion =
  | "version-1-custom-interest-v1-aptitude-v1"
  | "version-2-quick-riasec-v1-brief-aptitude-v1"
  | "version-2-detailed-riasec-v1-brief-aptitude-v1";

export interface AcademicProfile {
  name: string;
  intermediateGroup: StudentProfile["intermediateGroup"];
  subjectMarks: SubjectMark[];
}

interface Version2RecommendationInputBase {
  version: 2;
  academicProfile: AcademicProfile;
  briefAptitudeResult: BriefAptitudeAssessmentResult;
  aptitudeEvidenceLabel: "Limited";
}

export interface Version2QuickRecommendationInput
  extends Version2RecommendationInputBase {
  assessmentMode: "quick";
  scoringModelVersion: "version-2-quick-55-30-15";
  questionnaireVersion: "version-2-quick-riasec-v1-brief-aptitude-v1";
  riasecResult: QuickInterestAssessmentResult;
  riasecEvidenceLabel: "Preliminary";
}

export interface Version2DetailedRecommendationInput
  extends Version2RecommendationInputBase {
  assessmentMode: "detailed";
  scoringModelVersion: "version-2-detailed-50-35-15";
  questionnaireVersion: "version-2-detailed-riasec-v1-brief-aptitude-v1";
  riasecResult: DetailedRiasecAssessmentResult;
  riasecEvidenceLabel: "Stronger interest evidence";
}

export type Version2RecommendationInput =
  | Version2QuickRecommendationInput
  | Version2DetailedRecommendationInput;

export type RecommendationInput =
  | { version: 1; studentProfile: StudentProfile }
  | Version2RecommendationInput;

export interface RecommendationComponentWeights {
  academic: number;
  interest: number;
  aptitude: number;
}

interface RecommendationResultBase {
  programId: ProgramId;
  programName: string;
  academicScore: number;
  interestScore: number;
  aptitudeScore: number;
  finalScore: number;
  recommendationBand: RecommendationBand;
  confidence: RecommendationConfidence;
  evidenceCoverage: number;
  reasons: string[];
  improvementAreas: string[];
  /** Present only for Version 2 mode-aware results. */
  confidenceNotes?: string[];
}

export interface EligibleRecommendationResult
  extends RecommendationResultBase {
  eligibilityStatus: "Eligible";
  rank: number;
}

export interface UnrankedRecommendationResult
  extends RecommendationResultBase {
  eligibilityStatus: Exclude<EligibilityStatus, "Eligible">;
  rank: null;
}

/**
 * Only eligible programs receive a numeric rank. Not-eligible and
 * verification-required programs remain visible but unranked.
 */
export type RecommendationResult =
  | EligibleRecommendationResult
  | UnrankedRecommendationResult;

export interface PresentedEligibleRecommendation {
  recommendation: EligibleRecommendationResult;
  comparisonWithPrevious: RecommendationScoreComparison | null;
}

export interface Version2RecommendationMetadata {
  version: 2;
  assessmentMode: AssessmentMode;
  scoringModelVersion: Exclude<
    ScoringModelVersion,
    "version-1-custom-50-30-20"
  >;
  questionnaireVersion: Exclude<
    QuestionnaireVersion,
    "version-1-custom-interest-v1-aptitude-v1"
  >;
  riasecEvidenceLabel: RiasecEvidenceLabel;
  aptitudeEvidenceLabel: "Limited";
  componentWeights: RecommendationComponentWeights;
}
