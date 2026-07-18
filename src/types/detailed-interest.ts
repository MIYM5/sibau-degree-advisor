import type {
  RiasecDimension,
  RiasecProfile,
  RiasecScores,
} from "./riasec";

export type DetailedRiasecQuestionNumber = 1 | 2 | 3 | 4 | 5;
export type DetailedRiasecQuestionId =
  `detailed-${RiasecDimension}-${DetailedRiasecQuestionNumber}`;
export type DetailedRiasecResponseValue = 1 | 2 | 3 | 4 | 5;

export interface DetailedRiasecQuestion {
  id: DetailedRiasecQuestionId;
  statement: string;
  dimension: RiasecDimension;
  displayOrder: number;
}

export interface DetailedRiasecResponse {
  questionId: DetailedRiasecQuestionId;
  value: DetailedRiasecResponseValue;
}

export type DetailedRiasecValidationCode =
  | "malformed_responses"
  | "malformed_response"
  | "unknown_question"
  | "duplicate_question_response"
  | "missing_question"
  | "response_out_of_range"
  | "response_not_integer"
  | "duplicate_question_id"
  | "invalid_question_order"
  | "invalid_dimension_coverage";

export interface DetailedRiasecValidationError {
  code: DetailedRiasecValidationCode;
  message: string;
  questionId?: string;
  dimension?: RiasecDimension;
}

export interface DetailedRiasecValidationResult {
  responses: DetailedRiasecResponse[];
  missingQuestionIds: DetailedRiasecQuestionId[];
  errors: DetailedRiasecValidationError[];
  isComplete: boolean;
  isValid: boolean;
}

export interface DetailedRiasecDimensionCoverage {
  dimension: RiasecDimension;
  answeredQuestions: number;
  totalQuestions: number;
  percentageCoverage: number;
}

export interface DetailedRiasecEvidenceCoverage {
  answeredQuestions: number;
  totalQuestions: number;
  percentageCoverage: number;
  perDimension: Record<RiasecDimension, DetailedRiasecDimensionCoverage>;
}

export interface DetailedRiasecAssessmentResult {
  responses: DetailedRiasecResponse[];
  scores: RiasecScores;
  profile: RiasecProfile | null;
  profileExplanation: string | null;
  evidenceLabel: "Stronger interest evidence";
  evidenceCoverage: DetailedRiasecEvidenceCoverage;
  missingQuestionIds: DetailedRiasecQuestionId[];
  errors: DetailedRiasecValidationError[];
  isComplete: boolean;
  isValid: boolean;
}
