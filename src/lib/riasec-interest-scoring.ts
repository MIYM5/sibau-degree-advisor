import {
  riasecDimensionLabels,
  riasecDimensionOrder,
  type ProgramRiasecWeights,
  type RiasecDimension,
  type RiasecScores,
} from "../types/riasec";

export interface RiasecContribution {
  dimension: RiasecDimension;
  studentScore: number;
  programWeight: number;
  contribution: number;
}

export interface RiasecInterestScoringResult {
  score: number;
  evidenceCoverage: 1;
  contributions: RiasecContribution[];
  reasons: string[];
  improvementAreas: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateCompleteScores(value: unknown, label: string): RiasecScores {
  if (!isRecord(value)) {
    throw new TypeError(`${label} must contain all six RIASEC dimensions.`);
  }

  const keys = Object.keys(value);
  const unknownKeys = keys.filter(
    (key) => !riasecDimensionOrder.includes(key as RiasecDimension),
  );
  if (unknownKeys.length > 0) {
    throw new RangeError(
      `${label} contains unknown RIASEC dimensions: ${unknownKeys.join(", ")}.`,
    );
  }

  if (keys.length !== riasecDimensionOrder.length) {
    const missing = riasecDimensionOrder.filter(
      (dimension) => !(dimension in value),
    );
    throw new RangeError(
      `${label} is missing RIASEC dimensions: ${missing.join(", ")}.`,
    );
  }

  for (const dimension of riasecDimensionOrder) {
    const score = value[dimension];
    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) {
      throw new RangeError(
        `${label} ${riasecDimensionLabels[dimension]} value must be finite and between 0 and 100.`,
      );
    }
  }

  return value as RiasecScores;
}

/**
 * Calculates Version 2 career-interest suitability. Program RIASEC mappings
 * are project-model assumptions, never admission eligibility criteria.
 */
export function calculateRiasecInterestScore(
  studentScoresValue: unknown,
  programMapping: ProgramRiasecWeights,
): RiasecInterestScoringResult {
  const studentScores = validateCompleteScores(
    studentScoresValue,
    "Student RIASEC scores",
  );
  const programWeights = validateCompleteScores(
    programMapping.weights,
    "Program RIASEC weights",
  );
  const weightTotal = riasecDimensionOrder.reduce(
    (sum, dimension) => sum + programWeights[dimension],
    0,
  );
  if (Math.abs(weightTotal - 100) > 0.000001) {
    throw new RangeError(
      `Program RIASEC weights for ${programMapping.programId} must total 100.`,
    );
  }

  const contributions = riasecDimensionOrder.map((dimension) => ({
    dimension,
    studentScore: studentScores[dimension],
    programWeight: programWeights[dimension],
    contribution:
      studentScores[dimension] * (programWeights[dimension] / 100),
  }));
  const score = contributions.reduce(
    (sum, contribution) => sum + contribution.contribution,
    0,
  );
  const strongest = [...contributions].sort(
    (left, right) =>
      right.contribution - left.contribution ||
      riasecDimensionOrder.indexOf(left.dimension) -
        riasecDimensionOrder.indexOf(right.dimension),
  )[0];
  const weakestRelevant = [...contributions]
    .filter(({ programWeight }) => programWeight > 0)
    .sort(
      (left, right) =>
        left.studentScore - right.studentScore ||
        right.programWeight - left.programWeight ||
        riasecDimensionOrder.indexOf(left.dimension) -
          riasecDimensionOrder.indexOf(right.dimension),
    )[0];

  return {
    score,
    evidenceCoverage: 1,
    contributions,
    reasons: strongest
      ? [
          `RIASEC career-interest alignment is ${score.toFixed(1)}/100; the largest weighted contribution is ${riasecDimensionLabels[strongest.dimension]} (${strongest.studentScore.toFixed(1)}/100 at ${strongest.programWeight}% program weight).`,
        ]
      : [],
    improvementAreas: weakestRelevant
      ? [
          `${riasecDimensionLabels[weakestRelevant.dimension]} is the lowest current interest score among dimensions used by this program (${weakestRelevant.studentScore.toFixed(1)}/100). Explore related activities before treating this result as a fixed direction.`,
        ]
      : [],
  };
}
