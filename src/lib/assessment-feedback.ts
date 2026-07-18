import { programs } from "../data/programs";
import type { AssessmentMode } from "../types/assessment-mode";
import type {
  AssessmentFeedback,
  AssessmentFeedbackExpectedChoice,
  AssessmentFeedbackPlacement,
  AssessmentFeedbackRating,
  AssessmentFeedbackSessionPayload,
  AssessmentFeedbackValidationError,
  AssessmentFeedbackValidationResult,
} from "../types/assessment-feedback";
import type { ProgramId } from "../types/program";

export const ASSESSMENT_FEEDBACK_SCHEMA_VERSION = 1 as const;
export const ASSESSMENT_FEEDBACK_SESSION_KEY =
  "sibau-degree-advisor:assessment-feedback:v1";
export const ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH = 300;

const programIds = new Set<ProgramId>(programs.map(({ id }) => id));
const placements = new Set<AssessmentFeedbackPlacement>([
  "top_three",
  "alternative_options",
  "verification_required",
  "not_eligible",
  "not_recommended",
  "no_previous_choice",
  "prefer_not_to_answer",
]);

const feedbackFields = new Set([
  "schemaVersion",
  "feedbackId",
  "assessmentSessionId",
  "assessmentMode",
  "interestAlignmentRating",
  "personalRelevanceRating",
  "explanationUsefulnessRating",
  "previouslyConsideredProgramId",
  "outsideSibauField",
  "noPreviousChoice",
  "expectedChoicePlacement",
  "optionalComment",
  "submittedAt",
]);

interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface CreateAssessmentFeedbackInput {
  assessmentSessionId: string;
  assessmentMode: AssessmentMode;
  interestAlignmentRating: AssessmentFeedbackRating;
  personalRelevanceRating: AssessmentFeedbackRating;
  explanationUsefulnessRating: AssessmentFeedbackRating;
  expectedChoice: AssessmentFeedbackExpectedChoice;
  expectedChoicePlacement: AssessmentFeedbackPlacement;
  optionalComment?: string;
  feedbackId?: string;
  submittedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssessmentMode(value: unknown): value is AssessmentMode {
  return value === "quick" || value === "detailed";
}

function isRating(value: unknown): value is AssessmentFeedbackRating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isProgramId(value: unknown): value is ProgramId {
  return typeof value === "string" && programIds.has(value as ProgramId);
}

function isPlacement(value: unknown): value is AssessmentFeedbackPlacement {
  return typeof value === "string" && placements.has(value as AssessmentFeedbackPlacement);
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function isAnonymousId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function anonymousId(): string {
  return globalThis.crypto.randomUUID();
}

function error(
  field: AssessmentFeedbackValidationError["field"],
  code: string,
  message: string,
): AssessmentFeedbackValidationError {
  return { field, code, message };
}

export function validateAssessmentFeedback(
  value: unknown,
): AssessmentFeedbackValidationResult {
  const errors: AssessmentFeedbackValidationError[] = [];
  if (!isRecord(value)) {
    return {
      isValid: false,
      errors: [error("payload", "malformed_payload", "Feedback must be an object.")],
    };
  }

  if (Object.keys(value).some((field) => !feedbackFields.has(field))) {
    errors.push(
      error(
        "payload",
        "unknown_field",
        "Feedback contains an unknown or disallowed field.",
      ),
    );
  }
  if (value.schemaVersion !== ASSESSMENT_FEEDBACK_SCHEMA_VERSION) {
    errors.push(
      error(
        "schemaVersion",
        "schema_version_mismatch",
        "Feedback uses an unsupported schema version.",
      ),
    );
  }
  if (!isAnonymousId(value.feedbackId)) {
    errors.push(error("feedbackId", "invalid_feedback_id", "Feedback ID is invalid."));
  }
  if (!isAnonymousId(value.assessmentSessionId)) {
    errors.push(
      error(
        "assessmentSessionId",
        "invalid_assessment_session_id",
        "Assessment session ID is invalid.",
      ),
    );
  }
  if (!isAssessmentMode(value.assessmentMode)) {
    errors.push(
      error(
        "assessmentMode",
        "unknown_assessment_mode",
        "Assessment mode must be Quick or Detailed Guidance.",
      ),
    );
  }

  for (const [field, rating] of [
    ["interestAlignmentRating", value.interestAlignmentRating],
    ["personalRelevanceRating", value.personalRelevanceRating],
    ["explanationUsefulnessRating", value.explanationUsefulnessRating],
  ] as const) {
    if (!isRating(rating)) {
      errors.push(
        error(
          field,
          "invalid_rating",
          "Select a whole-number rating from 1 to 5.",
        ),
      );
    }
  }

  if (
    value.previouslyConsideredProgramId !== null &&
    !isProgramId(value.previouslyConsideredProgramId)
  ) {
    errors.push(
      error(
        "previouslyConsideredProgramId",
        "unknown_program_id",
        "The previously considered SIBAU program is not recognized.",
      ),
    );
  }
  if (typeof value.outsideSibauField !== "boolean") {
    errors.push(
      error(
        "outsideSibauField",
        "invalid_outside_sibau_flag",
        "Outside-SIBAU choice must be true or false.",
      ),
    );
  }
  if (typeof value.noPreviousChoice !== "boolean") {
    errors.push(
      error(
        "noPreviousChoice",
        "invalid_no_previous_choice_flag",
        "No-previous-choice must be true or false.",
      ),
    );
  }
  if (!isPlacement(value.expectedChoicePlacement)) {
    errors.push(
      error(
        "expectedChoicePlacement",
        "unknown_placement",
        "Select a recognized recommendation placement.",
      ),
    );
  }

  if (
    value.optionalComment !== undefined &&
    typeof value.optionalComment !== "string"
  ) {
    errors.push(
      error("optionalComment", "invalid_comment", "Comment must be text."),
    );
  } else if (
    typeof value.optionalComment === "string" &&
    value.optionalComment.length > ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH
  ) {
    errors.push(
      error(
        "optionalComment",
        "comment_too_long",
        `Comment must be ${ASSESSMENT_FEEDBACK_COMMENT_MAX_LENGTH} characters or fewer.`,
      ),
    );
  }
  if (!isValidIsoTimestamp(value.submittedAt)) {
    errors.push(
      error(
        "submittedAt",
        "invalid_timestamp",
        "Submitted timestamp must be a valid ISO timestamp.",
      ),
    );
  }

  const hasProgram = isProgramId(value.previouslyConsideredProgramId);
  const isOutside = value.outsideSibauField === true;
  const hasNoChoice = value.noPreviousChoice === true;
  const selectedChoiceCount = Number(hasProgram) + Number(isOutside) + Number(hasNoChoice);

  if (selectedChoiceCount > 1) {
    errors.push(
      error(
        "previouslyConsideredProgramId",
        "inconsistent_previous_choice",
        "Choose only one previous-choice category.",
      ),
    );
  }
  if (
    hasNoChoice &&
    value.expectedChoicePlacement !== "no_previous_choice"
  ) {
    errors.push(
      error(
        "expectedChoicePlacement",
        "inconsistent_no_previous_choice_placement",
        "No previous choice must use the No previous choice placement.",
      ),
    );
  }
  if (
    !hasProgram &&
    !isOutside &&
    !hasNoChoice &&
    value.expectedChoicePlacement !== "prefer_not_to_answer"
  ) {
    errors.push(
      error(
        "expectedChoicePlacement",
        "inconsistent_prefer_not_to_answer_placement",
        "A private previous choice must use Prefer not to answer placement.",
      ),
    );
  }
  if (
    (hasProgram || isOutside) &&
    value.expectedChoicePlacement === "no_previous_choice"
  ) {
    errors.push(
      error(
        "expectedChoicePlacement",
        "inconsistent_recommendation_placement",
        "A stated previous choice cannot use No previous choice placement.",
      ),
    );
  }
  if (
    isOutside &&
    value.expectedChoicePlacement !== "not_recommended" &&
    value.expectedChoicePlacement !== "prefer_not_to_answer"
  ) {
    errors.push(
      error(
        "expectedChoicePlacement",
        "inconsistent_outside_sibau_placement",
        "An outside-SIBAU field can be Not recommended or Prefer not to answer.",
      ),
    );
  }

  if (errors.length > 0) return { isValid: false, errors };

  const normalizedComment =
    typeof value.optionalComment === "string" && value.optionalComment.trim()
      ? value.optionalComment.trim()
      : undefined;
  const feedback: AssessmentFeedback = {
    schemaVersion: ASSESSMENT_FEEDBACK_SCHEMA_VERSION,
    feedbackId: value.feedbackId as string,
    assessmentSessionId: value.assessmentSessionId as string,
    assessmentMode: value.assessmentMode as AssessmentMode,
    interestAlignmentRating: value.interestAlignmentRating as AssessmentFeedbackRating,
    personalRelevanceRating: value.personalRelevanceRating as AssessmentFeedbackRating,
    explanationUsefulnessRating: value.explanationUsefulnessRating as AssessmentFeedbackRating,
    previouslyConsideredProgramId:
      value.previouslyConsideredProgramId as ProgramId | null,
    outsideSibauField: value.outsideSibauField as boolean,
    noPreviousChoice: value.noPreviousChoice as boolean,
    expectedChoicePlacement:
      value.expectedChoicePlacement as AssessmentFeedbackPlacement,
    ...(normalizedComment ? { optionalComment: normalizedComment } : {}),
    submittedAt: value.submittedAt as string,
  };

  return { isValid: true, feedback, errors: [] };
}

export function createAssessmentFeedback(
  input: CreateAssessmentFeedbackInput,
): AssessmentFeedbackValidationResult {
  const isProgram = programIds.has(input.expectedChoice as ProgramId);
  const candidate = {
    schemaVersion: ASSESSMENT_FEEDBACK_SCHEMA_VERSION,
    feedbackId: input.feedbackId ?? anonymousId(),
    assessmentSessionId: input.assessmentSessionId,
    assessmentMode: input.assessmentMode,
    interestAlignmentRating: input.interestAlignmentRating,
    personalRelevanceRating: input.personalRelevanceRating,
    explanationUsefulnessRating: input.explanationUsefulnessRating,
    previouslyConsideredProgramId: isProgram
      ? (input.expectedChoice as ProgramId)
      : null,
    outsideSibauField: input.expectedChoice === "outside_sibau",
    noPreviousChoice: input.expectedChoice === "no_previous_choice",
    expectedChoicePlacement: input.expectedChoicePlacement,
    optionalComment: input.optionalComment,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  };
  return validateAssessmentFeedback(candidate);
}

export function serializeAssessmentFeedback(feedback: AssessmentFeedback): string {
  const validation = validateAssessmentFeedback(feedback);
  if (!validation.isValid || !validation.feedback) {
    throw new RangeError("Cannot serialize invalid assessment feedback.");
  }
  return JSON.stringify(validation.feedback);
}

export function parseAssessmentFeedback(
  serialized: string | null,
): AssessmentFeedback | null {
  if (!serialized) return null;
  try {
    const validation = validateAssessmentFeedback(JSON.parse(serialized));
    return validation.isValid ? (validation.feedback ?? null) : null;
  } catch {
    return null;
  }
}

export function createAssessmentFeedbackSessionPayload(
  recommendationCreatedAt: string,
): AssessmentFeedbackSessionPayload {
  if (!isValidIsoTimestamp(recommendationCreatedAt)) {
    throw new RangeError("Recommendation timestamp must be a valid ISO timestamp.");
  }
  return {
    schemaVersion: ASSESSMENT_FEEDBACK_SCHEMA_VERSION,
    assessmentSessionId: anonymousId(),
    recommendationCreatedAt,
    feedback: null,
  };
}

export function parseAssessmentFeedbackSessionPayload(
  serialized: string | null,
): AssessmentFeedbackSessionPayload | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (
      !isRecord(value) ||
      Object.keys(value).some(
        (field) =>
          ![
            "schemaVersion",
            "assessmentSessionId",
            "recommendationCreatedAt",
            "feedback",
          ].includes(field),
      ) ||
      value.schemaVersion !== ASSESSMENT_FEEDBACK_SCHEMA_VERSION ||
      !isAnonymousId(value.assessmentSessionId) ||
      !isValidIsoTimestamp(value.recommendationCreatedAt) ||
      !(value.feedback === null || isRecord(value.feedback))
    ) {
      return null;
    }
    const validation =
      value.feedback === null ? null : validateAssessmentFeedback(value.feedback);
    if (
      validation &&
      (!validation.isValid ||
        validation.feedback?.assessmentSessionId !== value.assessmentSessionId)
    ) {
      return null;
    }
    return {
      schemaVersion: ASSESSMENT_FEEDBACK_SCHEMA_VERSION,
      assessmentSessionId: value.assessmentSessionId,
      recommendationCreatedAt: value.recommendationCreatedAt,
      feedback: validation?.feedback ?? null,
    };
  } catch {
    return null;
  }
}

export function getOrCreateAssessmentFeedbackSession(
  storage: SessionStorageLike,
  recommendationCreatedAt: string,
): AssessmentFeedbackSessionPayload {
  const existing = parseAssessmentFeedbackSessionPayload(
    storage.getItem(ASSESSMENT_FEEDBACK_SESSION_KEY),
  );
  if (existing?.recommendationCreatedAt === recommendationCreatedAt) {
    return existing;
  }
  const created = createAssessmentFeedbackSessionPayload(recommendationCreatedAt);
  storage.setItem(ASSESSMENT_FEEDBACK_SESSION_KEY, JSON.stringify(created));
  return created;
}

export function submitAssessmentFeedback(
  storage: SessionStorageLike,
  session: AssessmentFeedbackSessionPayload,
  feedback: unknown,
): AssessmentFeedbackValidationResult {
  const validation = validateAssessmentFeedback(feedback);
  if (!validation.isValid || !validation.feedback) return validation;

  const current = parseAssessmentFeedbackSessionPayload(
    storage.getItem(ASSESSMENT_FEEDBACK_SESSION_KEY),
  );
  if (
    !current ||
    current.assessmentSessionId !== session.assessmentSessionId ||
    current.recommendationCreatedAt !== session.recommendationCreatedAt
  ) {
    return {
      isValid: false,
      errors: [
        error(
          "session",
          "feedback_session_mismatch",
          "This feedback does not belong to the current result session.",
        ),
      ],
    };
  }
  if (current.feedback) {
    return {
      isValid: false,
      errors: [
        error(
          "session",
          "duplicate_feedback_submission",
          "Feedback has already been submitted for this result session.",
        ),
      ],
    };
  }
  if (validation.feedback.assessmentSessionId !== current.assessmentSessionId) {
    return {
      isValid: false,
      errors: [
        error(
          "assessmentSessionId",
          "feedback_session_mismatch",
          "This feedback does not belong to the current result session.",
        ),
      ],
    };
  }

  const updated: AssessmentFeedbackSessionPayload = {
    ...current,
    feedback: validation.feedback,
  };
  storage.setItem(ASSESSMENT_FEEDBACK_SESSION_KEY, JSON.stringify(updated));
  return validation;
}

export function suggestExpectedChoicePlacement(
  expectedChoice: AssessmentFeedbackExpectedChoice,
  visiblePlacements: Readonly<Partial<Record<ProgramId, AssessmentFeedbackPlacement>>>,
): AssessmentFeedbackPlacement | null {
  if (
    expectedChoice === "no_previous_choice" ||
    expectedChoice === "prefer_not_to_answer" ||
    expectedChoice === "outside_sibau"
  ) {
    return null;
  }
  return visiblePlacements[expectedChoice] ?? "not_recommended";
}
