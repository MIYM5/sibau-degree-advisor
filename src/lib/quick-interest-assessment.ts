import { quickInterestScenarios } from "../data/quick-interest-scenarios";
import {
  createRiasecProfile,
  riasecDimensionOrder,
  type RiasecScores,
} from "../types/riasec";
import type {
  QuickInterestAssessmentResult,
  QuickInterestChoiceId,
  QuickInterestResponse,
  QuickInterestScenario,
  QuickInterestValidationError,
} from "../types/quick-interest";

const MINIMUM_RAW_SCORE = -5;
const MAXIMUM_RAW_SCORE = 10;
const RAW_SCORE_RANGE = MAXIMUM_RAW_SCORE - MINIMUM_RAW_SCORE;

const preferenceFields = [
  ["mostPreferredChoiceId", 2],
  ["secondPreferredChoiceId", 1],
  ["leastPreferredChoiceId", -1],
] as const;

export const QUICK_INTEREST_DISCLAIMER =
  "This brief, project-designed activity provides preliminary career-interest guidance. It is not the official O*NET Interest Profiler or a validated psychometric assessment.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyScores(): RiasecScores {
  return {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };
}

function normalizeRawScore(rawScore: number): number {
  const normalized =
    ((rawScore - MINIMUM_RAW_SCORE) / RAW_SCORE_RANGE) * 100;
  return Math.min(100, Math.max(0, normalized));
}

function inspectResponse(
  value: unknown,
  scenario: QuickInterestScenario,
  allChoiceIds: ReadonlySet<string>,
): {
  response: QuickInterestResponse | null;
  errors: QuickInterestValidationError[];
} {
  const errors: QuickInterestValidationError[] = [];
  if (!isRecord(value)) {
    return {
      response: null,
      errors: [
        {
          code: "malformed_response",
          scenarioId: scenario.id,
          message: `${scenario.title} response is malformed.`,
        },
      ],
    };
  }

  const preferenceIds: string[] = [];
  for (const [field] of preferenceFields) {
    const choiceId = value[field];
    if (typeof choiceId !== "string" || choiceId.length === 0) {
      errors.push({
        code: "missing_preference",
        scenarioId: scenario.id,
        message: `${scenario.title} requires most, second, and least preferences.`,
      });
      continue;
    }

    preferenceIds.push(choiceId);
    if (!allChoiceIds.has(choiceId)) {
      errors.push({
        code: "unknown_choice",
        scenarioId: scenario.id,
        message: `${scenario.title} contains an unknown choice: ${choiceId}.`,
      });
      continue;
    }
    if (!scenario.choices.some((choice) => choice.id === choiceId)) {
      errors.push({
        code: "choice_not_in_scenario",
        scenarioId: scenario.id,
        message: `${choiceId} does not belong to ${scenario.title}.`,
      });
    }
  }

  if (
    preferenceIds.length === preferenceFields.length &&
    new Set(preferenceIds).size !== preferenceIds.length
  ) {
    errors.push({
      code: "duplicate_preference",
      scenarioId: scenario.id,
      message: `${scenario.title} must use different choices for most, second, and least.`,
    });
  }

  if (errors.length > 0) return { response: null, errors };

  return {
    errors: [],
    response: {
      scenarioId: scenario.id,
      mostPreferredChoiceId: value.mostPreferredChoiceId as QuickInterestChoiceId,
      secondPreferredChoiceId:
        value.secondPreferredChoiceId as QuickInterestChoiceId,
      leastPreferredChoiceId: value.leastPreferredChoiceId as QuickInterestChoiceId,
    },
  };
}

export function calculateQuickInterestAssessment(
  value: unknown,
  scenarios: readonly QuickInterestScenario[] = quickInterestScenarios,
): QuickInterestAssessmentResult {
  const errors: QuickInterestValidationError[] = [];
  const validResponses: QuickInterestResponse[] = [];
  const seenScenarioIds = new Set<string>();
  const validScenarioIds = new Set<string>();
  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const allChoiceIds = new Set(
    scenarios.flatMap((scenario) => scenario.choices.map((choice) => choice.id)),
  );

  if (!Array.isArray(value)) {
    errors.push({
      code: "malformed_responses",
      message: "Quick interest responses must be provided as a list.",
    });
  } else {
    for (const candidate of value) {
      if (!isRecord(candidate) || typeof candidate.scenarioId !== "string") {
        errors.push({
          code: "malformed_response",
          message: "A quick interest response is malformed.",
        });
        continue;
      }

      const scenarioId = candidate.scenarioId;
      const scenario = scenarioById.get(
        scenarioId as QuickInterestScenario["id"],
      );
      if (!scenario) {
        errors.push({
          code: "unknown_scenario",
          scenarioId,
          message: `Unknown quick interest scenario: ${scenarioId}.`,
        });
        continue;
      }
      if (seenScenarioIds.has(scenarioId)) {
        errors.push({
          code: "duplicate_scenario_response",
          scenarioId,
          message: `${scenario.title} has more than one response.`,
        });
        continue;
      }
      seenScenarioIds.add(scenarioId);

      const inspected = inspectResponse(candidate, scenario, allChoiceIds);
      errors.push(...inspected.errors);
      if (inspected.response) {
        validResponses.push(inspected.response);
        validScenarioIds.add(scenarioId);
      }
    }
  }

  for (const scenario of scenarios) {
    if (!validScenarioIds.has(scenario.id)) {
      errors.push({
        code: "missing_scenario",
        scenarioId: scenario.id,
        message: `${scenario.title} must be completed.`,
      });
    }
  }

  const rawScores = emptyScores();
  for (const response of validResponses) {
    const scenario = scenarioById.get(response.scenarioId);
    if (!scenario) continue;

    for (const [field, points] of preferenceFields) {
      const choice = scenario.choices.find(
        (candidate) => candidate.id === response[field],
      );
      if (choice) rawScores[choice.dimension] += points;
    }
  }

  const scores = Object.fromEntries(
    riasecDimensionOrder.map((dimension) => [
      dimension,
      normalizeRawScore(rawScores[dimension]),
    ]),
  ) as RiasecScores;
  const completedScenarioCount = validScenarioIds.size;
  const isComplete = completedScenarioCount === scenarios.length;
  const isValid = isComplete && errors.length === 0;

  validResponses.sort(
    (left, right) =>
      (scenarioById.get(left.scenarioId)?.displayOrder ?? 0) -
      (scenarioById.get(right.scenarioId)?.displayOrder ?? 0),
  );

  return {
    responses: validResponses,
    rawScores,
    scores,
    profile: isValid ? createRiasecProfile(scores, "Preliminary") : null,
    evidenceLabel: "Preliminary",
    completedScenarioCount,
    totalScenarioCount: scenarios.length,
    evidenceCoverage:
      scenarios.length > 0 ? completedScenarioCount / scenarios.length : 0,
    errors,
    isComplete,
    isValid,
  };
}

export function serializeQuickInterestResponses(
  responses: readonly QuickInterestResponse[],
): string {
  return JSON.stringify(responses);
}

export function parseQuickInterestResponses(
  serialized: string | null,
): QuickInterestResponse[] | null {
  if (serialized === null) return null;
  try {
    const result = calculateQuickInterestAssessment(JSON.parse(serialized));
    return result.isValid ? result.responses : null;
  } catch {
    return null;
  }
}
