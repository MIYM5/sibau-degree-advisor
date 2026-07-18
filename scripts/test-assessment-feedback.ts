import {
  ASSESSMENT_FEEDBACK_SESSION_KEY,
  createAssessmentFeedback,
  getOrCreateAssessmentFeedbackSession,
  parseAssessmentFeedback,
  parseAssessmentFeedbackSessionPayload,
  serializeAssessmentFeedback,
  submitAssessmentFeedback,
  validateAssessmentFeedback,
} from "../src/lib/assessment-feedback";
import { RECOMMENDATION_SESSION_KEY } from "../src/lib/assessment-session";
import type { AssessmentFeedback } from "../src/types/assessment-feedback";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function hasError(
  result: ReturnType<typeof validateAssessmentFeedback>,
  code: string,
): boolean {
  return result.errors.some((item) => item.code === code);
}

class MemorySessionStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const quickFeedback: AssessmentFeedback = {
  schemaVersion: 1,
  feedbackId: "729be1f6-6de8-4df2-9ac6-3cb203eed7c2",
  assessmentSessionId: "c26baa32-bf64-4f10-bd2f-3f86409e147a",
  assessmentMode: "quick",
  interestAlignmentRating: 4,
  personalRelevanceRating: 5,
  explanationUsefulnessRating: 4,
  previouslyConsideredProgramId: "SIBAU-BSCS",
  outsideSibauField: false,
  noPreviousChoice: false,
  expectedChoicePlacement: "top_three",
  optionalComment: "The computing options matched my interests.",
  submittedAt: "2026-07-18T08:30:00.000Z",
};

const tests: readonly { name: string; run: () => void }[] = [
  {
    name: "valid Quick feedback is accepted",
    run: () => assert(validateAssessmentFeedback(quickFeedback).isValid, "Quick feedback was rejected."),
  },
  {
    name: "valid Detailed feedback is accepted",
    run: () => {
      const result = validateAssessmentFeedback({
        ...quickFeedback,
        assessmentMode: "detailed",
      });
      assert(result.isValid, "Detailed feedback was rejected.");
    },
  },
  {
    name: "assessment mode is preserved",
    run: () => {
      const result = validateAssessmentFeedback({
        ...quickFeedback,
        assessmentMode: "detailed",
      });
      assert(result.feedback?.assessmentMode === "detailed", "Mode changed during validation.");
    },
  },
  {
    name: "rating 0 is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, interestAlignmentRating: 0 }), "invalid_rating"), "Rating 0 was accepted."),
  },
  {
    name: "rating 6 is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, personalRelevanceRating: 6 }), "invalid_rating"), "Rating 6 was accepted."),
  },
  {
    name: "non-integer rating is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, explanationUsefulnessRating: 3.5 }), "invalid_rating"), "Non-integer rating was accepted."),
  },
  {
    name: "unknown program ID is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, previouslyConsideredProgramId: "SIBAU-UNKNOWN" }), "unknown_program_id"), "Unknown program ID was accepted."),
  },
  {
    name: "unknown placement is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, expectedChoicePlacement: "somewhere_else" }), "unknown_placement"), "Unknown placement was accepted."),
  },
  {
    name: "a 300-character comment is accepted",
    run: () => assert(validateAssessmentFeedback({ ...quickFeedback, optionalComment: "a".repeat(300) }).isValid, "A 300-character comment was rejected."),
  },
  {
    name: "a comment over 300 characters is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, optionalComment: "a".repeat(301) }), "comment_too_long"), "A 301-character comment was accepted."),
  },
  {
    name: "malformed payload is rejected safely",
    run: () => assert(hasError(validateAssessmentFeedback("not an object"), "malformed_payload"), "Malformed payload was accepted."),
  },
  {
    name: "schema-version mismatch is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, schemaVersion: 2 }), "schema_version_mismatch"), "Unsupported schema was accepted."),
  },
  {
    name: "invalid timestamp is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, submittedAt: "18 July 2026" }), "invalid_timestamp"), "Invalid timestamp was accepted."),
  },
  {
    name: "program ID plus no-previous-choice is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, noPreviousChoice: true }), "inconsistent_previous_choice"), "Conflicting program/no-choice state was accepted."),
  },
  {
    name: "outside-SIBAU plus program ID is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, outsideSibauField: true }), "inconsistent_previous_choice"), "Conflicting program/outside state was accepted."),
  },
  {
    name: "outside-SIBAU field plus Top three placement is rejected",
    run: () => {
      const result = validateAssessmentFeedback({
        ...quickFeedback,
        previouslyConsideredProgramId: null,
        outsideSibauField: true,
        expectedChoicePlacement: "top_three",
      });
      assert(hasError(result, "inconsistent_outside_sibau_placement"), "Conflicting outside placement was accepted.");
    },
  },
  {
    name: "no-previous-choice plus recommendation placement is rejected",
    run: () => {
      const result = validateAssessmentFeedback({
        ...quickFeedback,
        previouslyConsideredProgramId: null,
        noPreviousChoice: true,
        expectedChoicePlacement: "top_three",
      });
      assert(hasError(result, "inconsistent_no_previous_choice_placement"), "Conflicting no-choice placement was accepted.");
    },
  },
  {
    name: "serialization and parsing preserve valid feedback",
    run: () => {
      const parsed = parseAssessmentFeedback(serializeAssessmentFeedback(quickFeedback));
      assert(JSON.stringify(parsed) === JSON.stringify(quickFeedback), "Feedback changed after serialization.");
    },
  },
  {
    name: "duplicate submission for one assessment session is rejected",
    run: () => {
      const storage = new MemorySessionStorage();
      const session = {
        schemaVersion: 1 as const,
        assessmentSessionId: quickFeedback.assessmentSessionId,
        recommendationCreatedAt: "2026-07-18T08:00:00.000Z",
        feedback: null,
      };
      storage.setItem(ASSESSMENT_FEEDBACK_SESSION_KEY, JSON.stringify(session));
      assert(submitAssessmentFeedback(storage, session, quickFeedback).isValid, "First submission failed.");
      const duplicate = submitAssessmentFeedback(storage, session, quickFeedback);
      assert(hasError(duplicate, "duplicate_feedback_submission"), "Duplicate submission was accepted.");
    },
  },
  {
    name: "feedback session key is separate from recommendation session key",
    run: () => assert(String(ASSESSMENT_FEEDBACK_SESSION_KEY) !== String(RECOMMENDATION_SESSION_KEY), "Session keys overlap."),
  },
  {
    name: "feedback submission does not mutate recommendation result data",
    run: () => {
      const recommendationResult = { recommendations: [{ programId: "SIBAU-BSCS", finalScore: 82, rank: 1 }] };
      const before = JSON.stringify(recommendationResult);
      const storage = new MemorySessionStorage();
      const session = {
        schemaVersion: 1 as const,
        assessmentSessionId: quickFeedback.assessmentSessionId,
        recommendationCreatedAt: "2026-07-18T08:00:00.000Z",
        feedback: null,
      };
      storage.setItem(ASSESSMENT_FEEDBACK_SESSION_KEY, JSON.stringify(session));
      submitAssessmentFeedback(storage, session, quickFeedback);
      assert(JSON.stringify(recommendationResult) === before, "Recommendation data was mutated.");
    },
  },
  {
    name: "student name is absent from feedback payload",
    run: () => assert(!("name" in quickFeedback) && !serializeAssessmentFeedback(quickFeedback).includes("studentName"), "Feedback contains a student name field."),
  },
  {
    name: "feedback remains available after same-tab refresh",
    run: () => {
      const storage = new MemorySessionStorage();
      const createdAt = "2026-07-18T08:00:00.000Z";
      const initial = getOrCreateAssessmentFeedbackSession(storage, createdAt);
      const feedbackResult = createAssessmentFeedback({
        assessmentSessionId: initial.assessmentSessionId,
        assessmentMode: "quick",
        interestAlignmentRating: 4,
        personalRelevanceRating: 4,
        explanationUsefulnessRating: 4,
        expectedChoice: "SIBAU-BSCS",
        expectedChoicePlacement: "top_three",
      });
      assert(feedbackResult.feedback, "Feedback creation failed.");
      assert(submitAssessmentFeedback(storage, initial, feedbackResult.feedback).isValid, "Submission failed.");
      const refreshed = getOrCreateAssessmentFeedbackSession(storage, createdAt);
      assert(refreshed.feedback?.feedbackId === feedbackResult.feedback.feedbackId, "Stored feedback was not restored.");
    },
  },
  {
    name: "empty comments normalize to an omitted value",
    run: () => {
      const result = validateAssessmentFeedback({ ...quickFeedback, optionalComment: "   " });
      assert(result.isValid && result.feedback?.optionalComment === undefined, "Empty comment was not normalized.");
    },
  },
  {
    name: "unknown assessment mode is rejected",
    run: () => assert(hasError(validateAssessmentFeedback({ ...quickFeedback, assessmentMode: "full" }), "unknown_assessment_mode"), "Unknown mode was accepted."),
  },
  {
    name: "stored feedback payload is validated at runtime",
    run: () => {
      const malformed = JSON.stringify({
        schemaVersion: 1,
        assessmentSessionId: quickFeedback.assessmentSessionId,
        recommendationCreatedAt: "2026-07-18T08:00:00.000Z",
        feedback: { ...quickFeedback, interestAlignmentRating: 8 },
      });
      assert(parseAssessmentFeedbackSessionPayload(malformed) === null, "Invalid stored feedback was restored.");
    },
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}
console.log(`\n${passed}/${tests.length} assessment feedback tests passed.`);
