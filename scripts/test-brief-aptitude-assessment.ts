import { aptitudeQuestions } from "../src/data/aptitude-questions";
import {
  briefAptitudeTasks,
  getBriefAptitudeTasksForMode,
} from "../src/data/brief-aptitude-tasks";
import { interestQuestions } from "../src/data/interest-questions";
import { quickInterestScenarios } from "../src/data/quick-interest-scenarios";
import { toSubjectMarks } from "../src/lib/assessment-form";
import {
  createRecommendationSessionPayload,
  parseAssessmentSessionDraft,
  parseRecommendationSessionPayload,
} from "../src/lib/assessment-session";
import {
  buildStudentProfile,
  buildVersion2StudentProfile,
} from "../src/lib/assessment-to-student-profile";
import type { AptitudeResponses } from "../src/lib/aptitude-assessment";
import {
  calculateBriefAptitudeAssessment,
  parseBriefAptitudeResponses,
  serializeBriefAptitudeResponses,
  validateBriefAptitudeConfiguration,
} from "../src/lib/brief-aptitude-assessment";
import type { InterestResponses } from "../src/lib/interest-assessment";
import { generateRecommendations } from "../src/lib/recommendation-engine";
import type {
  BriefAptitudeChoiceId,
  BriefAptitudeResponse,
  BriefAptitudeTaskId,
} from "../src/types/brief-aptitude";
import { briefAptitudeDimensionOrder } from "../src/types/brief-aptitude";
import type { QuickInterestResponse } from "../src/types/quick-interest";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const correctResponses: BriefAptitudeResponse[] = [
  { taskId: "brief-numerical", selectedChoiceId: "brief-numerical-C" },
  { taskId: "brief-logical", selectedChoiceId: "brief-logical-D" },
  { taskId: "brief-verbal", selectedChoiceId: "brief-verbal-B" },
  {
    taskId: "brief-spatial-technical",
    selectedChoiceId: "brief-spatial-technical-B",
  },
  {
    taskId: "brief-data-interpretation",
    selectedChoiceId: "brief-data-interpretation-B",
  },
];

const incorrectResponses: BriefAptitudeResponse[] = [
  { taskId: "brief-numerical", selectedChoiceId: "brief-numerical-A" },
  { taskId: "brief-logical", selectedChoiceId: "brief-logical-A" },
  { taskId: "brief-verbal", selectedChoiceId: "brief-verbal-A" },
  {
    taskId: "brief-spatial-technical",
    selectedChoiceId: "brief-spatial-technical-A",
  },
  {
    taskId: "brief-data-interpretation",
    selectedChoiceId: "brief-data-interpretation-A",
  },
];

function completeLegacyAptitudeResponses(): AptitudeResponses {
  return Object.fromEntries(
    aptitudeQuestions.map(({ id }) => [id, 3]),
  ) as AptitudeResponses;
}

function completeLegacyInterestResponses(): InterestResponses {
  return Object.fromEntries(
    interestQuestions.map(({ id }) => [id, 3]),
  ) as InterestResponses;
}

function completeQuickInterestResponses(): QuickInterestResponse[] {
  return quickInterestScenarios.map((scenario) => ({
    scenarioId: scenario.id,
    mostPreferredChoiceId: scenario.choices[0].id,
    secondPreferredChoiceId: scenario.choices[1].id,
    leastPreferredChoiceId: scenario.choices[2].id,
  }));
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Exactly five brief aptitude tasks exist",
    run: () =>
      assert(briefAptitudeTasks.length === 5, "Expected exactly five tasks."),
  },
  {
    name: "Task IDs are unique",
    run: () =>
      assert(
        new Set(briefAptitudeTasks.map(({ id }) => id)).size === 5,
        "Expected five unique task IDs.",
      ),
  },
  {
    name: "Display orders are unique and sequential",
    run: () => {
      const orders = briefAptitudeTasks.map(({ displayOrder }) => displayOrder);
      assert(
        new Set(orders).size === 5 &&
          orders.every((order, index) => order === index + 1),
        "Task orders should be 1 through 5.",
      );
    },
  },
  {
    name: "All five aptitude dimensions are represented exactly once",
    run: () => {
      const dimensions = briefAptitudeTasks.map(({ dimension }) => dimension);
      assert(
        new Set(dimensions).size === briefAptitudeDimensionOrder.length &&
          briefAptitudeDimensionOrder.every(
            (dimension) =>
              dimensions.filter((candidate) => candidate === dimension).length === 1,
          ),
        "Expected one task for each aptitude dimension.",
      );
    },
  },
  {
    name: "Every task has exactly four ordered choices",
    run: () =>
      assert(
        briefAptitudeTasks.every(
          ({ choices }) =>
            choices.length === 4 &&
            choices.every(
              (choice, index) => choice.displayOrder === index + 1,
            ),
        ),
        "Every task should have four sequential choices.",
      ),
  },
  {
    name: "Every task has exactly one correct answer",
    run: () => {
      assert(
        validateBriefAptitudeConfiguration().length === 0,
        "The answer key should match the task bank.",
      );
      for (const task of briefAptitudeTasks) {
        let correctChoiceCount = 0;
        for (const choice of task.choices) {
          const responses = correctResponses.map((response) =>
            response.taskId === task.id
              ? { taskId: task.id, selectedChoiceId: choice.id }
              : response,
          );
          const result = calculateBriefAptitudeAssessment(responses);
          if (
            result.taskResults.find(({ taskId }) => taskId === task.id)
              ?.isCorrect
          ) {
            correctChoiceCount += 1;
          }
        }
        assert(
          correctChoiceCount === 1,
          `${task.title} should have exactly one correct choice.`,
        );
      }
    },
  },
  {
    name: "Correct answers are absent from user-facing task objects",
    run: () => {
      const serializedTasks = JSON.stringify(briefAptitudeTasks);
      assert(
        !serializedTasks.includes("correctAnswer") &&
          !serializedTasks.includes("isCorrect"),
        "The user-facing task bank must not expose answer metadata.",
      );
    },
  },
  {
    name: "All correct responses produce 5 out of 5 and 100 percent",
    run: () => {
      const result = calculateBriefAptitudeAssessment(correctResponses);
      assert(result.isValid, "Correct responses should be valid.");
      assert(result.totalCorrect === 5, "Expected five correct responses.");
      assert(result.overallPercentage === 100, "Expected 100 percent.");
    },
  },
  {
    name: "Four correct responses produce 4 out of 5 and 80 percent",
    run: () => {
      const responses = correctResponses.map((response) =>
        response.taskId === "brief-numerical"
          ? incorrectResponses[0]
          : response,
      );
      const result = calculateBriefAptitudeAssessment(responses);
      assert(result.totalCorrect === 4, "Expected four correct responses.");
      assert(result.overallPercentage === 80, "Expected 80 percent.");
    },
  },
  {
    name: "Zero correct responses produce 0 out of 5 and zero percent",
    run: () => {
      const result = calculateBriefAptitudeAssessment(incorrectResponses);
      assert(result.totalCorrect === 0, "Expected zero correct responses.");
      assert(result.overallPercentage === 0, "Expected zero percent.");
    },
  },
  {
    name: "A missing response is rejected",
    run: () => {
      const result = calculateBriefAptitudeAssessment(correctResponses.slice(0, 4));
      assert(!result.isValid && !result.isComplete, "Four responses are incomplete.");
      assert(result.missingTaskIds.length === 1, "Expected one missing task.");
    },
  },
  {
    name: "An unknown task is rejected",
    run: () => {
      const responses: unknown[] = [...correctResponses];
      responses[0] = {
        taskId: "brief-unknown" as BriefAptitudeTaskId,
        selectedChoiceId: "brief-numerical-C",
      };
      const result = calculateBriefAptitudeAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "unknown_task"),
        "Expected unknown-task rejection.",
      );
    },
  },
  {
    name: "An unknown choice is rejected",
    run: () => {
      const responses: unknown[] = [...correctResponses];
      responses[0] = {
        taskId: "brief-numerical",
        selectedChoiceId: "brief-numerical-Z" as BriefAptitudeChoiceId,
      };
      const result = calculateBriefAptitudeAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "unknown_choice"),
        "Expected unknown-choice rejection.",
      );
    },
  },
  {
    name: "A duplicate task response is rejected",
    run: () => {
      const result = calculateBriefAptitudeAssessment([
        ...correctResponses,
        correctResponses[0],
      ]);
      assert(
        result.errors.some(({ code }) => code === "duplicate_task_response"),
        "Expected duplicate-task rejection.",
      );
    },
  },
  {
    name: "A selected choice must belong to its task",
    run: () => {
      const responses: unknown[] = [...correctResponses];
      responses[0] = {
        taskId: "brief-numerical",
        selectedChoiceId: "brief-logical-D",
      };
      const result = calculateBriefAptitudeAssessment(responses);
      assert(
        result.errors.some(({ code }) => code === "choice_not_in_task"),
        "Expected cross-task choice rejection.",
      );
    },
  },
  {
    name: "Response order does not affect scoring",
    run: () => {
      const forward = calculateBriefAptitudeAssessment(correctResponses);
      const reversed = calculateBriefAptitudeAssessment(
        [...correctResponses].reverse(),
      );
      assert(
        forward.totalCorrect === reversed.totalCorrect &&
          JSON.stringify(forward.responses) === JSON.stringify(reversed.responses),
        "Scoring and normalized response order should be deterministic.",
      );
    },
  },
  {
    name: "Evidence coverage is calculated correctly",
    run: () => {
      const result = calculateBriefAptitudeAssessment(correctResponses.slice(0, 3));
      assert(result.evidenceCoverage.answeredTasks === 3, "Expected three answers.");
      assert(result.evidenceCoverage.totalTasks === 5, "Expected five tasks.");
      assert(
        result.evidenceCoverage.percentageCoverage === 60,
        "Expected 60 percent coverage.",
      );
    },
  },
  {
    name: "Confidence is always Limited",
    run: () => {
      for (const responses of [correctResponses, incorrectResponses]) {
        assert(
          calculateBriefAptitudeAssessment(responses).confidenceLabel ===
            "Limited",
          "Confidence should always be Limited.",
        );
      }
    },
  },
  {
    name: "Serialization and parsing preserve responses",
    run: () => {
      const parsed = parseBriefAptitudeResponses(
        serializeBriefAptitudeResponses(correctResponses),
      );
      assert(
        JSON.stringify(parsed) === JSON.stringify(correctResponses),
        "Responses should survive serialization.",
      );
    },
  },
  {
    name: "Quick and Detailed Guidance use the same task bank",
    run: () => {
      assert(
        getBriefAptitudeTasksForMode("quick") ===
          getBriefAptitudeTasksForMode("detailed") &&
          getBriefAptitudeTasksForMode("quick") === briefAptitudeTasks,
        "Both modes should share one immutable task bank.",
      );
    },
  },
  {
    name: "Legacy Version 1 session handling remains safe",
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
        aptitudeResponses: completeLegacyAptitudeResponses(),
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
      assert(built.isValid, "A legacy profile should still rebuild safely.");
      assert(
        Object.keys(built.profile.aptitudeScores).length > 0,
        "Legacy aptitude scores should remain available.",
      );
    },
  },
  {
    name: "New Version 2 sessions store brief responses and use payload version 2",
    run: () => {
      const subjectRows = [
        {
          subject: "Mathematics" as const,
          obtainedMarks: 80,
          totalMarks: 100,
          calculatedPercentage: 80,
          isOptional: false,
        },
      ];
      const draft = {
        schemaVersion: 2 as const,
        name: "Version 2 Student",
        intermediateGroup: "ICS" as const,
        subjectRows,
        interestResponses: {},
        aptitudeResponses: {},
        quickInterestResponses: completeQuickInterestResponses(),
        briefAptitudeResponses: correctResponses,
      };
      const parsedDraft = parseAssessmentSessionDraft(JSON.stringify(draft));
      assert(parsedDraft !== null, "The Version 2 draft should parse.");
      assert(
        JSON.stringify(parsedDraft.briefAptitudeResponses) ===
          JSON.stringify(correctResponses),
        "Brief responses should survive draft parsing.",
      );

      const built = buildVersion2StudentProfile({
        name: draft.name,
        intermediateGroup: draft.intermediateGroup,
        subjectMarks: toSubjectMarks(subjectRows),
        briefAptitudeResponses: correctResponses,
      });
      assert(built.isValid, "The Version 2 profile should build.");
      assert(
        Object.keys(built.profile.aptitudeScores).length === 0,
        "Brief results must remain outside legacy aptitude dimensions.",
      );

      const payload = createRecommendationSessionPayload(
        draft,
        built.profile,
        generateRecommendations(built.profile),
      );
      assert(payload.version === 2, "New payloads should use version 2.");
      assert(
        parseRecommendationSessionPayload(JSON.stringify(payload)) !== null,
        "The Version 2 recommendation payload should parse.",
      );
    },
  },
  {
    name: "Malformed response data is rejected safely",
    run: () => {
      const result = calculateBriefAptitudeAssessment({ invalid: true });
      assert(!result.isValid, "Malformed data should be invalid.");
      assert(
        result.errors.some(({ code }) => code === "malformed_responses"),
        "Expected malformed-list rejection.",
      );
      assert(
        parseBriefAptitudeResponses("not-json") === null,
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
  `Brief aptitude assessment tests passed: ${tests.length}/${tests.length}.`,
);
