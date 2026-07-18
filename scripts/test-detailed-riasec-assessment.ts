import { aptitudeQuestions } from "../src/data/aptitude-questions";
import { detailedRiasecQuestions } from "../src/data/detailed-riasec-questions";
import { interestQuestions } from "../src/data/interest-questions";
import {
  buildDetailedStudentProfile,
  buildStudentProfile,
} from "../src/lib/assessment-to-student-profile";
import { toSubjectMarks } from "../src/lib/assessment-form";
import {
  createRecommendationSessionPayload,
  parseAssessmentSessionDraft,
  parseRecommendationSessionPayload,
} from "../src/lib/assessment-session";
import type { AptitudeResponses } from "../src/lib/aptitude-assessment";
import {
  calculateDetailedRiasecAssessment,
  parseDetailedRiasecResponses,
  serializeDetailedRiasecResponses,
  validateDetailedRiasecQuestions,
} from "../src/lib/detailed-riasec-assessment";
import type { InterestResponses } from "../src/lib/interest-assessment";
import { generateRecommendations } from "../src/lib/recommendation-engine";
import type {
  DetailedRiasecQuestionId,
  DetailedRiasecResponse,
  DetailedRiasecResponseValue,
} from "../src/types/detailed-interest";
import { riasecDimensionOrder } from "../src/types/riasec";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function completeResponses(
  valueForQuestion: (
    questionIndex: number,
    questionId: DetailedRiasecQuestionId,
  ) => DetailedRiasecResponseValue = () => 3,
): DetailedRiasecResponse[] {
  return detailedRiasecQuestions.map((question, index) => ({
    questionId: question.id,
    value: valueForQuestion(index, question.id),
  }));
}

function completeAptitudeResponses(): AptitudeResponses {
  return Object.fromEntries(
    aptitudeQuestions.map(({ id }) => [id, 3]),
  ) as AptitudeResponses;
}

function completeLegacyInterestResponses(): InterestResponses {
  return Object.fromEntries(
    interestQuestions.map(({ id }) => [id, 3]),
  ) as InterestResponses;
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Exactly 30 Detailed RIASEC questions exist",
    run: () =>
      assert(detailedRiasecQuestions.length === 30, "Expected 30 questions."),
  },
  {
    name: "Question IDs are unique",
    run: () =>
      assert(
        new Set(detailedRiasecQuestions.map(({ id }) => id)).size === 30,
        "Expected 30 unique question IDs.",
      ),
  },
  {
    name: "Display orders are unique and sequential",
    run: () => {
      const orders = detailedRiasecQuestions.map(({ displayOrder }) => displayOrder);
      assert(
        new Set(orders).size === 30 &&
          orders.every((order, index) => order === index + 1),
        "Question orders should be 1 through 30.",
      );
      assert(
        validateDetailedRiasecQuestions().length === 0,
        "Static question data should pass structural validation.",
      );
    },
  },
  {
    name: "Exactly five questions exist per RIASEC dimension",
    run: () => {
      for (const dimension of riasecDimensionOrder) {
        assert(
          detailedRiasecQuestions.filter(
            (question) => question.dimension === dimension,
          ).length === 5,
          `${dimension} should have five questions.`,
        );
      }
    },
  },
  {
    name: "All six RIASEC dimensions are represented",
    run: () =>
      assert(
        new Set(detailedRiasecQuestions.map(({ dimension }) => dimension)).size ===
          riasecDimensionOrder.length,
        "Expected all six dimensions.",
      ),
  },
  {
    name: "All responses at 1 produce zero for every dimension",
    run: () => {
      const result = calculateDetailedRiasecAssessment(
        completeResponses(() => 1),
      );
      assert(result.isValid, "All-one responses should be valid.");
      assert(
        riasecDimensionOrder.every((dimension) => result.scores[dimension] === 0),
        "All scores should be zero.",
      );
    },
  },
  {
    name: "All responses at 3 produce 50 for every dimension",
    run: () => {
      const result = calculateDetailedRiasecAssessment(completeResponses());
      assert(result.isValid, "All-neutral responses should be valid.");
      assert(
        riasecDimensionOrder.every((dimension) => result.scores[dimension] === 50),
        "All scores should be 50.",
      );
    },
  },
  {
    name: "All responses at 5 produce 100 for every dimension",
    run: () => {
      const result = calculateDetailedRiasecAssessment(
        completeResponses(() => 5),
      );
      assert(result.isValid, "All-five responses should be valid.");
      assert(
        riasecDimensionOrder.every(
          (dimension) => result.scores[dimension] === 100,
        ),
        "All scores should be 100.",
      );
    },
  },
  {
    name: "Mixed responses use the arithmetic mean",
    run: () => {
      const scale = [1, 2, 3, 4, 5] as const;
      const result = calculateDetailedRiasecAssessment(
        completeResponses((index) => scale[index % 5]),
      );
      assert(
        riasecDimensionOrder.every((dimension) => result.scores[dimension] === 50),
        "The mean of 0, 25, 50, 75, and 100 should be 50.",
      );
    },
  },
  {
    name: "Missing responses are detected",
    run: () => {
      const result = calculateDetailedRiasecAssessment(
        completeResponses().slice(0, 29),
      );
      assert(!result.isComplete && !result.isValid, "29 answers are incomplete.");
      assert(result.missingQuestionIds.length === 1, "Expected one missing ID.");
      assert(
        result.errors.some(({ code }) => code === "missing_question"),
        "Expected a missing-question error.",
      );
    },
  },
  {
    name: "Evidence coverage is calculated overall and per dimension",
    run: () => {
      const result = calculateDetailedRiasecAssessment(
        completeResponses().slice(1),
      );
      assert(result.evidenceCoverage.answeredQuestions === 29, "Expected 29 answers.");
      assert(result.evidenceCoverage.totalQuestions === 30, "Expected 30 total.");
      assert(
        Math.abs(result.evidenceCoverage.percentageCoverage - (29 / 30) * 100) <
          0.000001,
        "Expected full-precision overall coverage.",
      );
      assert(
        result.evidenceCoverage.perDimension.realistic.percentageCoverage === 80,
        "Realistic coverage should be 80%.",
      );
    },
  },
  {
    name: "Unknown question IDs are rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      responses[0] = { questionId: "detailed-unknown-1", value: 3 };
      const result = calculateDetailedRiasecAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "unknown_question"),
        "Expected unknown-question rejection.",
      );
    },
  },
  {
    name: "Duplicate question responses are rejected",
    run: () => {
      const responses = completeResponses();
      const result = calculateDetailedRiasecAssessment([
        ...responses,
        responses[0],
      ]);
      assert(
        result.errors.some(({ code }) => code === "duplicate_question_response"),
        "Expected duplicate-response rejection.",
      );
    },
  },
  {
    name: "Out-of-range responses are rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      responses[0] = {
        questionId: detailedRiasecQuestions[0].id,
        value: 6,
      };
      const result = calculateDetailedRiasecAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "response_out_of_range"),
        "Expected out-of-range rejection.",
      );
    },
  },
  {
    name: "Non-integer responses are rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      responses[0] = {
        questionId: detailedRiasecQuestions[0].id,
        value: 2.5,
      };
      const result = calculateDetailedRiasecAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "response_not_integer"),
        "Expected non-integer rejection.",
      );
    },
  },
  {
    name: "All scores remain between zero and 100",
    run: () => {
      const result = calculateDetailedRiasecAssessment(
        completeResponses((index) => ((index % 5) + 1) as DetailedRiasecResponseValue),
      );
      assert(
        Object.values(result.scores).every((score) => score >= 0 && score <= 100),
        "Scores must remain in range.",
      );
    },
  },
  {
    name: "Top-three profile ordering is deterministic",
    run: () => {
      const responses = completeResponses();
      const first = calculateDetailedRiasecAssessment(responses);
      const second = calculateDetailedRiasecAssessment(responses);
      assert(
        first.profile?.topThreeDimensions.join(",") ===
          second.profile?.topThreeDimensions.join(","),
        "Repeated scoring should preserve the same order.",
      );
    },
  },
  {
    name: "Tied dimensions use stable R-I-A-S-E-C order",
    run: () => {
      const result = calculateDetailedRiasecAssessment(completeResponses());
      assert(
        result.profile?.topThreeDimensions.join(",") ===
          "realistic,investigative,artistic",
        "Equal scores should use stable R-I-A order first.",
      );
    },
  },
  {
    name: "Three-letter profile code is correct",
    run: () => {
      const dimensionValues = [5, 4, 3, 2, 1, 1] as const;
      const result = calculateDetailedRiasecAssessment(
        completeResponses((index) => dimensionValues[Math.floor(index / 5)]),
      );
      assert(
        result.profile?.hollandCode === "RIA",
        `Expected RIA, received ${result.profile?.hollandCode}.`,
      );
      assert(
        result.profileExplanation?.includes("not a diagnosis or fixed personality type"),
        "The explanation should avoid fixed-type claims.",
      );
    },
  },
  {
    name: "Serialization and parsing preserve responses",
    run: () => {
      const responses = completeResponses();
      const parsed = parseDetailedRiasecResponses(
        serializeDetailedRiasecResponses(responses),
      );
      assert(
        JSON.stringify(parsed) === JSON.stringify(responses),
        "Responses should survive serialization.",
      );
    },
  },
  {
    name: "Legacy Version 1 session compatibility remains valid",
    run: () => {
      const legacyDraft = {
        name: "Legacy Student",
        intermediateGroup: "Pre-Medical",
        subjectRows: [
          {
            subject: "Biology",
            obtainedMarks: 80,
            totalMarks: 100,
            calculatedPercentage: 80,
            isOptional: false,
          },
        ],
        interestResponses: completeLegacyInterestResponses(),
        aptitudeResponses: completeAptitudeResponses(),
      };
      const parsed = parseAssessmentSessionDraft(JSON.stringify(legacyDraft));
      assert(parsed !== null, "A valid Version 1 draft should still parse.");
      const built = buildStudentProfile({
        name: parsed.name,
        intermediateGroup: parsed.intermediateGroup,
        subjectMarks: toSubjectMarks(parsed.subjectRows),
        interestResponses: parsed.interestResponses,
        aptitudeResponses: parsed.aptitudeResponses,
      });
      assert(built.isValid, "The legacy profile should still rebuild.");
      assert(
        Object.keys(built.profile.interestScores).length > 0,
        "Legacy Version 1 interest scores should remain available.",
      );
    },
  },
  {
    name: "Detailed responses survive the optional session field",
    run: () => {
      const responses = completeResponses();
      const parsed = parseAssessmentSessionDraft(
        JSON.stringify({
          name: "Detailed Student",
          intermediateGroup: "ICS",
          subjectRows: [
            {
              subject: "Mathematics",
              obtainedMarks: 80,
              totalMarks: 100,
              calculatedPercentage: 80,
              isOptional: false,
            },
          ],
          interestResponses: {},
          aptitudeResponses: completeAptitudeResponses(),
          detailedInterestResponses: responses,
        }),
      );
      assert(parsed !== null, "Expected the Detailed draft to be valid.");
      assert(
        JSON.stringify(parsed.detailedInterestResponses) ===
          JSON.stringify(responses),
        "Detailed responses should survive draft parsing.",
      );
    },
  },
  {
    name: "Detailed RIASEC scores remain outside Version 1 StudentProfile interests",
    run: () => {
      const built = buildDetailedStudentProfile({
        name: "Detailed Student",
        intermediateGroup: "ICS",
        subjectMarks: [
          {
            subject: "Mathematics",
            obtainedMarks: 80,
            totalMarks: 100,
            calculatedPercentage: 80,
          },
        ],
        aptitudeResponses: completeAptitudeResponses(),
      });
      assert(built.isValid, "Expected a valid Detailed Guidance profile.");
      assert(
        Object.keys(built.profile.interestScores).length === 0,
        "Detailed RIASEC values must not enter Version 1 interest scores.",
      );
    },
  },
  {
    name: "Detailed recommendation session payloads rebuild without RIASEC scoring",
    run: () => {
      const aptitudeResponses = completeAptitudeResponses();
      const detailedInterestResponses = completeResponses();
      const subjectRows = [
        {
          subject: "Mathematics" as const,
          obtainedMarks: 80,
          totalMarks: 100,
          calculatedPercentage: 80,
          isOptional: false,
        },
      ];
      const built = buildDetailedStudentProfile({
        name: "Detailed Student",
        intermediateGroup: "ICS",
        subjectMarks: toSubjectMarks(subjectRows),
        aptitudeResponses,
      });
      assert(built.isValid, "Expected a valid Detailed Guidance profile.");
      const draft = {
        name: "Detailed Student",
        intermediateGroup: "ICS" as const,
        subjectRows,
        interestResponses: {},
        aptitudeResponses,
        detailedInterestResponses,
      };
      const payload = createRecommendationSessionPayload(
        draft,
        built.profile,
        generateRecommendations(built.profile),
      );
      assert(
        parseRecommendationSessionPayload(JSON.stringify(payload)) !== null,
        "A Detailed result payload should survive validation and rebuilding.",
      );
    },
  },
  {
    name: "Malformed response data is rejected safely",
    run: () => {
      const result = calculateDetailedRiasecAssessment({ invalid: true });
      assert(!result.isValid, "Malformed data should be invalid.");
      assert(
        result.errors.some(({ code }) => code === "malformed_responses"),
        "Expected malformed-list rejection.",
      );
      assert(
        parseDetailedRiasecResponses("not-json") === null,
        "Invalid JSON should fail safely.",
      );
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(
  `Detailed RIASEC assessment tests passed: ${tests.length}/${tests.length}.`,
);
