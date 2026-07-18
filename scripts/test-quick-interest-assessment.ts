import { quickInterestScenarios } from "../src/data/quick-interest-scenarios";
import { aptitudeQuestions } from "../src/data/aptitude-questions";
import { buildQuickStudentProfile } from "../src/lib/assessment-to-student-profile";
import { parseAssessmentSessionDraft } from "../src/lib/assessment-session";
import {
  calculateQuickInterestAssessment,
  parseQuickInterestResponses,
  serializeQuickInterestResponses,
} from "../src/lib/quick-interest-assessment";
import { riasecDimensionOrder } from "../src/types/riasec";
import type {
  QuickInterestResponse,
  QuickInterestScenarioId,
} from "../src/types/quick-interest";
import type { AptitudeResponses } from "../src/lib/aptitude-assessment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function completeResponses(): QuickInterestResponse[] {
  return quickInterestScenarios.map((scenario) => ({
    scenarioId: scenario.id,
    mostPreferredChoiceId: scenario.choices[0].id,
    secondPreferredChoiceId: scenario.choices[1].id,
    leastPreferredChoiceId: scenario.choices[2].id,
  }));
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Exactly five Quick Guidance scenarios exist",
    run: () =>
      assert(quickInterestScenarios.length === 5, "Expected five scenarios."),
  },
  {
    name: "Scenario display orders are unique and sequential",
    run: () => {
      const orders = quickInterestScenarios.map(({ displayOrder }) => displayOrder);
      assert(
        orders.join(",") === "1,2,3,4,5" && new Set(orders).size === 5,
        "Scenario orders should be 1 through 5.",
      );
    },
  },
  {
    name: "Each scenario has exactly six choices",
    run: () =>
      assert(
        quickInterestScenarios.every(({ choices }) => choices.length === 6),
        "Every scenario should have six choices.",
      ),
  },
  {
    name: "Every scenario represents all six RIASEC dimensions exactly once",
    run: () => {
      const expected = [...riasecDimensionOrder].sort().join(",");
      assert(
        quickInterestScenarios.every((scenario) => {
          const dimensions = scenario.choices
            .map(({ dimension }) => dimension)
            .sort();
          return (
            dimensions.join(",") === expected &&
            new Set(dimensions).size === riasecDimensionOrder.length
          );
        }),
        "Each scenario should cover R, I, A, S, E, and C once.",
      );
    },
  },
  {
    name: "Most, second, and least choices must be different",
    run: () => {
      const responses = completeResponses();
      responses[0] = {
        ...responses[0],
        secondPreferredChoiceId: responses[0].mostPreferredChoiceId,
      };
      const result = calculateQuickInterestAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "duplicate_preference"),
        "Expected duplicate preference rejection.",
      );
    },
  },
  {
    name: "A missing preference is rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      const first = responses[0] as Record<string, unknown>;
      delete first.leastPreferredChoiceId;
      const result = calculateQuickInterestAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "missing_preference"),
        "Expected missing preference rejection.",
      );
    },
  },
  {
    name: "An unknown scenario is rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      responses[0] = {
        ...(responses[0] as QuickInterestResponse),
        scenarioId: "unknown-scenario" as QuickInterestScenarioId,
      };
      const result = calculateQuickInterestAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "unknown_scenario"),
        "Expected unknown scenario rejection.",
      );
    },
  },
  {
    name: "An unknown choice is rejected",
    run: () => {
      const responses: unknown[] = completeResponses();
      responses[0] = {
        ...(responses[0] as QuickInterestResponse),
        mostPreferredChoiceId: "school-project-unknown",
      };
      const result = calculateQuickInterestAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "unknown_choice"),
        "Expected unknown choice rejection.",
      );
    },
  },
  {
    name: "A duplicate scenario response is rejected",
    run: () => {
      const responses = completeResponses();
      const result = calculateQuickInterestAssessment([
        ...responses,
        responses[0],
      ]);
      assert(
        result.errors.some(
          ({ code }) => code === "duplicate_scenario_response",
        ),
        "Expected duplicate scenario rejection.",
      );
    },
  },
  {
    name: "Complete valid responses produce all six RIASEC scores",
    run: () => {
      const result = calculateQuickInterestAssessment(completeResponses());
      assert(result.isValid, result.errors.map(({ message }) => message).join("\n"));
      assert(
        riasecDimensionOrder.every(
          (dimension) => typeof result.scores[dimension] === "number",
        ),
        "Expected all six normalized scores.",
      );
    },
  },
  {
    name: "Every normalized score remains between 0 and 100",
    run: () => {
      const result = calculateQuickInterestAssessment(completeResponses());
      assert(
        Object.values(result.scores).every(
          (score) => score >= 0 && score <= 100,
        ),
        "Normalized scores must remain in range.",
      );
    },
  },
  {
    name: "Scoring uses +2, +1, -1 and the stated normalization formula",
    run: () => {
      const result = calculateQuickInterestAssessment(completeResponses());
      assert(result.rawScores.realistic === 10, "Realistic raw score should be 10.");
      assert(
        result.rawScores.investigative === 5,
        "Investigative raw score should be 5.",
      );
      assert(result.rawScores.artistic === -5, "Artistic raw score should be -5.");
      assert(result.scores.realistic === 100, "Raw 10 should normalize to 100.");
      assert(result.scores.artistic === 0, "Raw -5 should normalize to 0.");
      assert(
        Math.abs(result.scores.investigative - (10 / 15) * 100) < 0.000001,
        "Raw 5 should preserve full normalized precision.",
      );
    },
  },
  {
    name: "Top-three profile ordering is deterministic",
    run: () => {
      const first = calculateQuickInterestAssessment(completeResponses());
      const second = calculateQuickInterestAssessment(completeResponses());
      assert(
        first.profile?.topThreeDimensions.join(",") ===
          second.profile?.topThreeDimensions.join(","),
        "Repeated scoring should preserve the same order.",
      );
    },
  },
  {
    name: "Tied scores use stable R-I-A-S-E-C ordering",
    run: () => {
      const result = calculateQuickInterestAssessment(completeResponses());
      assert(
        result.profile?.hollandCode === "RIS",
        `Expected RIS, received ${result.profile?.hollandCode}.`,
      );
      assert(
        result.profile.topThreeDimensions[2] === "social",
        "Social should win the unselected-dimension tie.",
      );
    },
  },
  {
    name: "Serialization and parsing preserve responses",
    run: () => {
      const responses = completeResponses();
      const parsed = parseQuickInterestResponses(
        serializeQuickInterestResponses(responses),
      );
      assert(
        JSON.stringify(parsed) === JSON.stringify(responses),
        "Responses should survive serialization.",
      );
    },
  },
  {
    name: "Incomplete responses report correct evidence coverage",
    run: () => {
      const result = calculateQuickInterestAssessment(
        completeResponses().slice(0, 2),
      );
      assert(!result.isComplete, "Two responses should be incomplete.");
      assert(result.completedScenarioCount === 2, "Expected two completed scenarios.");
      assert(result.evidenceCoverage === 0.4, "Expected 40% evidence coverage.");
    },
  },
  {
    name: "Quick RIASEC scores do not replace Version 1 StudentProfile interests",
    run: () => {
      const aptitudeResponses = Object.fromEntries(
        aptitudeQuestions.map(({ id }) => [id, 3]),
      ) as AptitudeResponses;
      const built = buildQuickStudentProfile({
        name: "Quick Student",
        intermediateGroup: "Pre-Medical",
        subjectMarks: [
          {
            subject: "Biology",
            obtainedMarks: 80,
            totalMarks: 100,
            calculatedPercentage: 80,
          },
        ],
        aptitudeResponses,
      });
      assert(built.isValid, "Expected a valid Quick Guidance profile.");
      assert(
        Object.keys(built.profile.interestScores).length === 0,
        "Quick RIASEC values must remain outside Version 1 interest scores.",
      );
    },
  },
  {
    name: "Quick responses survive the backward-compatible assessment session draft",
    run: () => {
      const aptitudeResponses = Object.fromEntries(
        aptitudeQuestions.map(({ id }) => [id, 3]),
      ) as AptitudeResponses;
      const responses = completeResponses();
      const parsed = parseAssessmentSessionDraft(
        JSON.stringify({
          name: "Quick Student",
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
          interestResponses: {},
          aptitudeResponses,
          quickInterestResponses: responses,
        }),
      );
      assert(parsed !== null, "Expected the Quick session draft to be valid.");
      assert(
        JSON.stringify(parsed.quickInterestResponses) === JSON.stringify(responses),
        "Quick responses should survive draft parsing.",
      );
    },
  },
  {
    name: "Malformed response data is rejected safely",
    run: () => {
      const result = calculateQuickInterestAssessment({ invalid: true });
      assert(!result.isValid, "Malformed data should be invalid.");
      assert(
        result.errors.some(({ code }) => code === "malformed_responses"),
        "Expected malformed response error.",
      );
      assert(parseQuickInterestResponses("not-json") === null, "Invalid JSON should fail.");
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`Quick interest assessment tests passed: ${tests.length}/${tests.length}.`);
