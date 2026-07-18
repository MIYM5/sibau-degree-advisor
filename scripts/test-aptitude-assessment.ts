import {
  aptitudeDimensionOrder,
  aptitudeQuestions,
  type AptitudeQuestionId,
} from "../src/data/aptitude-questions";
import {
  calculateAptitudeAssessment,
  type AptitudeResponses,
} from "../src/lib/aptitude-assessment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function responsesWithValue(value: number): AptitudeResponses {
  return Object.fromEntries(
    aptitudeQuestions.map((question) => [question.id, value]),
  ) as AptitudeResponses;
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Question data contains exactly 18 unique, sequential questions and three per dimension",
    run: () => {
      assert(aptitudeQuestions.length === 18, "Expected exactly 18 questions.");
      assert(
        new Set(aptitudeQuestions.map(({ id }) => id)).size === 18,
        "Every question ID must be unique.",
      );
      assert(
        aptitudeQuestions.every(
          ({ displayOrder }, index) => displayOrder === index + 1,
        ),
        "Display order must run sequentially from 1 to 18.",
      );
      for (const dimension of aptitudeDimensionOrder) {
        assert(
          aptitudeQuestions.filter((question) => question.dimension === dimension)
            .length === 3,
          `${dimension} must have exactly three questions.`,
        );
      }
    },
  },
  {
    name: "All responses at 1 produce zero for every dimension",
    run: () => {
      const result = calculateAptitudeAssessment(responsesWithValue(1));
      assert(result.isValid, "Complete in-range responses should be valid.");
      assert(
        result.dimensionResults.every(
          ({ score, evidenceCoverage }) =>
            score === 0 && evidenceCoverage === 1,
        ),
        "Every dimension should score 0 with full coverage.",
      );
    },
  },
  {
    name: "All responses at 3 produce 50 for every dimension",
    run: () => {
      const result = calculateAptitudeAssessment(responsesWithValue(3));
      assert(
        result.dimensionResults.every(({ score }) => score === 50),
        "Every dimension should score 50.",
      );
    },
  },
  {
    name: "All responses at 5 produce 100 for every dimension",
    run: () => {
      const result = calculateAptitudeAssessment(responsesWithValue(5));
      assert(
        result.dimensionResults.every(({ score }) => score === 100),
        "Every dimension should score 100.",
      );
    },
  },
  {
    name: "Mixed responses average correctly within a dimension",
    run: () => {
      const responses = responsesWithValue(3);
      responses["aptitude-logical-1"] = 1;
      responses["aptitude-logical-2"] = 3;
      responses["aptitude-logical-3"] = 5;
      const result = calculateAptitudeAssessment(responses);
      assert(
        result.scores["Logical Aptitude"] === 50,
        "Logical should average mapped scores 0, 50, and 100 to 50.",
      );
    },
  },
  {
    name: "Missing responses are detected and reduce evidence coverage",
    run: () => {
      const responses = responsesWithValue(4);
      delete responses["aptitude-logical-3"];
      const result = calculateAptitudeAssessment(responses);
      const logical = result.dimensionResults.find(
        ({ dimension }) => dimension === "Logical Aptitude",
      );
      assert(!result.isComplete, "A missing response must make the assessment incomplete.");
      assert(
        result.missingQuestionIds.includes("aptitude-logical-3"),
        "The missing question ID should be reported.",
      );
      assert(
        logical?.evidenceCoverage === 2 / 3,
        "Logical coverage should be two-thirds.",
      );
    },
  },
  {
    name: "Out-of-range responses are rejected",
    run: () => {
      const responses = responsesWithValue(3);
      responses["aptitude-logical-1" as AptitudeQuestionId] = 6;
      const result = calculateAptitudeAssessment(responses);
      assert(!result.isValid, "An out-of-range response must be invalid.");
      assert(
        result.invalidQuestionIds.includes("aptitude-logical-1"),
        "The invalid question ID should be reported.",
      );
    },
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`Aptitude assessment tests passed: ${passed}/${tests.length}.`);
