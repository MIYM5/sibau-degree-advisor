import {
  ASSESSMENT_MODE_SESSION_VERSION,
  createAssessmentModeSessionPayload,
  isAssessmentMode,
  parseAssessmentModeSession,
  resolveAssessmentModeSession,
  serializeAssessmentModeSession,
} from "../src/lib/assessment-mode-session";
import {
  assessmentModeMetadata,
  getAssessmentModeTotalQuestionCount,
} from "../src/types/assessment-mode";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Quick mode is accepted",
    run: () => assert(isAssessmentMode("quick"), "Quick should be accepted."),
  },
  {
    name: "Detailed mode is accepted",
    run: () =>
      assert(isAssessmentMode("detailed"), "Detailed should be accepted."),
  },
  {
    name: "Unknown mode is rejected",
    run: () =>
      assert(!isAssessmentMode("unknown"), "Unknown mode should be rejected."),
  },
  {
    name: "Malformed session payload is rejected",
    run: () => {
      assert(parseAssessmentModeSession("not-json") === null, "Invalid JSON should fail.");
      assert(
        parseAssessmentModeSession(JSON.stringify({ selectedMode: "quick" })) ===
          null,
        "A missing version should fail.",
      );
    },
  },
  {
    name: "Unsupported session version is rejected",
    run: () => {
      assert(
        parseAssessmentModeSession(
          JSON.stringify({ version: 999, selectedMode: "quick" }),
        ) === null,
        "An unsupported version should fail.",
      );
    },
  },
  {
    name: "Mode metadata contains the required question counts and time ranges",
    run: () => {
      assert(
        assessmentModeMetadata.quick.interestQuestionCount === 5 &&
          assessmentModeMetadata.quick.aptitudeQuestionCount === 5,
        "Quick metadata counts should be 5 and 5.",
      );
      assert(
        assessmentModeMetadata.detailed.interestQuestionCount === 30 &&
          assessmentModeMetadata.detailed.aptitudeQuestionCount === 5,
        "Detailed metadata counts should be 30 and 5.",
      );
      assert(
        assessmentModeMetadata.quick.estimatedMinutes.minimum === 3 &&
          assessmentModeMetadata.quick.estimatedMinutes.maximum === 5 &&
          assessmentModeMetadata.detailed.estimatedMinutes.minimum === 10 &&
          assessmentModeMetadata.detailed.estimatedMinutes.maximum === 15,
        "Mode time ranges should match the Version 2 architecture.",
      );
    },
  },
  {
    name: "Quick Guidance total is 10",
    run: () =>
      assert(
        getAssessmentModeTotalQuestionCount(assessmentModeMetadata.quick) === 10,
        "Quick total should be 10.",
      ),
  },
  {
    name: "Detailed Guidance total is 35",
    run: () =>
      assert(
        getAssessmentModeTotalQuestionCount(assessmentModeMetadata.detailed) ===
          35,
        "Detailed total should be 35.",
      ),
  },
  {
    name: "Selected mode survives serialization and parsing",
    run: () => {
      const parsed = parseAssessmentModeSession(
        serializeAssessmentModeSession("detailed"),
      );
      assert(parsed?.selectedMode === "detailed", "Detailed should round-trip.");
      assert(
        parsed.version === ASSESSMENT_MODE_SESSION_VERSION,
        "The supported version should round-trip.",
      );
    },
  },
  {
    name: "Legacy Version 1 session handling preserves the existing flow",
    run: () => {
      const resolution = resolveAssessmentModeSession(null, true);
      assert(
        resolution.status === "legacy",
        "A valid legacy draft without a mode should remain accessible.",
      );
      assert(
        createAssessmentModeSessionPayload("quick").version === 1,
        "The new mode payload should use its own schema version.",
      );
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`Assessment mode tests passed: ${tests.length}/${tests.length}.`);
