import type { AssessmentMode } from "./assessment-mode";
import type { ProgramId } from "./program";

export type AssessmentFeedbackRating = 1 | 2 | 3 | 4 | 5;

export type AssessmentFeedbackExpectedChoice =
  | ProgramId
  | "outside_sibau"
  | "no_previous_choice"
  | "prefer_not_to_answer";

export type AssessmentFeedbackPlacement =
  | "top_three"
  | "alternative_options"
  | "verification_required"
  | "not_eligible"
  | "not_recommended"
  | "no_previous_choice"
  | "prefer_not_to_answer";

export interface AssessmentFeedback {
  schemaVersion: 1;
  feedbackId: string;
  assessmentSessionId: string;
  assessmentMode: AssessmentMode;
  interestAlignmentRating: AssessmentFeedbackRating;
  personalRelevanceRating: AssessmentFeedbackRating;
  explanationUsefulnessRating: AssessmentFeedbackRating;
  previouslyConsideredProgramId: ProgramId | null;
  outsideSibauField: boolean;
  noPreviousChoice: boolean;
  expectedChoicePlacement: AssessmentFeedbackPlacement;
  optionalComment?: string;
  submittedAt: string;
}

/**
 * Temporary same-tab storage. The recommendation timestamp identifies which
 * visible result session owns the anonymous feedback record; it is not student
 * profile data and is not suitable for permanent research storage.
 */
export interface AssessmentFeedbackSessionPayload {
  schemaVersion: 1;
  assessmentSessionId: string;
  recommendationCreatedAt: string;
  feedback: AssessmentFeedback | null;
}

export interface AssessmentFeedbackValidationError {
  field: keyof AssessmentFeedback | "payload" | "session";
  code: string;
  message: string;
}

export interface AssessmentFeedbackValidationResult {
  isValid: boolean;
  feedback?: AssessmentFeedback;
  errors: AssessmentFeedbackValidationError[];
}
