import {
  interestDimensionOrder,
  interestQuestions,
  type InterestQuestionId,
} from "../src/data/interest-questions";
import {
  calculateInterestAssessment,
  type InterestResponses,
} from "../src/lib/interest-assessment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function responsesWithValue(value: number): InterestResponses {
  return Object.fromEntries(
    interestQuestions.map((question) => [question.id, value]),
  ) as InterestResponses;
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Question data contains exactly two statements for each of 11 dimensions",
    run: () => {
      assert(interestQuestions.length === 22, "Expected exactly 22 questions.");
      assert(
        new Set(interestQuestions.map(({ id }) => id)).size === 22,
        "Every question ID must be unique.",
      );
      assert(
        interestQuestions.every(
          ({ displayOrder }, index) => displayOrder === index + 1,
        ),
        "Display order must run sequentially from 1 to 22.",
      );
      for (const dimension of interestDimensionOrder) {
        assert(
          interestQuestions.filter((question) => question.dimension === dimension)
            .length === 2,
          `${dimension} must have exactly two questions.`,
        );
      }
    },
  },
  {
    name: "All responses at 1 produce zero for every dimension",
    run: () => {
      const result = calculateInterestAssessment(responsesWithValue(1));
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
      const result = calculateInterestAssessment(responsesWithValue(3));
      assert(
        result.dimensionResults.every(({ score }) => score === 50),
        "Every dimension should score 50.",
      );
    },
  },
  {
    name: "All responses at 5 produce 100 for every dimension",
    run: () => {
      const result = calculateInterestAssessment(responsesWithValue(5));
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
      responses["interest-coding-1"] = 1;
      responses["interest-coding-2"] = 5;
      const result = calculateInterestAssessment(responses);
      assert(
        result.scores["Coding Interest"] === 50,
        "Coding should average mapped scores 0 and 100 to 50.",
      );
    },
  },
  {
    name: "Missing responses are detected and reduce evidence coverage",
    run: () => {
      const responses = responsesWithValue(4);
      delete responses["interest-coding-2"];
      const result = calculateInterestAssessment(responses);
      const coding = result.dimensionResults.find(
        ({ dimension }) => dimension === "Coding Interest",
      );
      assert(!result.isComplete, "A missing response must make the assessment incomplete.");
      assert(
        result.missingQuestionIds.includes("interest-coding-2"),
        "The missing question ID should be reported.",
      );
      assert(coding?.evidenceCoverage === 0.5, "Coding coverage should be 50%.");
    },
  },
  {
    name: "Out-of-range responses are rejected",
    run: () => {
      const responses = responsesWithValue(3);
      responses["interest-coding-1" as InterestQuestionId] = 6;
      const result = calculateInterestAssessment(responses);
      assert(!result.isValid, "An out-of-range response must be invalid.");
      assert(
        result.invalidQuestionIds.includes("interest-coding-1"),
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

console.log(`Interest assessment tests passed: ${passed}/${tests.length}.`);
