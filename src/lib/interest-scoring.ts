import type {
  InterestDimension,
  InterestWeights,
} from "../types/program";
import type { InterestScores } from "../types/student";

export interface InterestScoringResult {
  score: number;
  evidenceCoverage: number;
  usedWeight: number;
  totalWeight: number;
  matchedDimensions: InterestDimension[];
  missingDimensions: InterestDimension[];
  invalidDimensions: InterestDimension[];
  reasons: string[];
  improvementAreas: string[];
  lowConfidence: boolean;
}

interface WeightedInterestScore {
  dimension: InterestDimension;
  score: number;
  weight: number;
}

const NEUTRAL_NO_EVIDENCE_SCORE = 50;

function positiveWeightEntries(
  weights: InterestWeights,
): Array<[InterestDimension, number]> {
  return Object.entries(weights).filter(
    (entry): entry is [InterestDimension, number] =>
      Number.isFinite(entry[1]) && entry[1] > 0,
  );
}

export function calculateInterestScore(
  weights: InterestWeights,
  studentScores: InterestScores,
): InterestScoringResult {
  const weightedDimensions = positiveWeightEntries(weights);
  const totalWeight = weightedDimensions.reduce(
    (sum, [, weight]) => sum + weight,
    0,
  );
  const available: WeightedInterestScore[] = [];
  const missingDimensions: InterestDimension[] = [];
  const invalidDimensions: InterestDimension[] = [];

  for (const [dimension, weight] of weightedDimensions) {
    const score = studentScores[dimension];

    if (score === undefined) {
      missingDimensions.push(dimension);
    } else if (!Number.isFinite(score) || score < 0 || score > 100) {
      invalidDimensions.push(dimension);
    } else {
      available.push({ dimension, score, weight });
    }
  }

  const usedWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const evidenceCoverage = totalWeight > 0 ? usedWeight / totalWeight : 0;

  if (usedWeight === 0) {
    return {
      score: NEUTRAL_NO_EVIDENCE_SCORE,
      evidenceCoverage,
      usedWeight,
      totalWeight,
      matchedDimensions: [],
      missingDimensions,
      invalidDimensions,
      reasons: [
        "No valid weighted interest response was available, so a neutral 50-point placeholder is used without claiming interest fit.",
      ],
      improvementAreas: [
        "Complete the relevant interest self-assessment to improve confidence.",
      ],
      lowConfidence: true,
    };
  }

  const score =
    available.reduce((sum, item) => sum + item.score * item.weight, 0) /
    usedWeight;
  const strongest = [...available].sort(
    (left, right) =>
      right.score * right.weight - left.score * left.weight ||
      left.dimension.localeCompare(right.dimension),
  )[0];
  const weakest = [...available].sort(
    (left, right) =>
      left.score - right.score ||
      right.weight - left.weight ||
      left.dimension.localeCompare(right.dimension),
  )[0];
  const reasons = strongest
    ? [
        `Strongest relevant interest: ${strongest.dimension} (${strongest.score.toFixed(1)}/100, weight ${strongest.weight}).`,
      ]
    : [];

  if (missingDimensions.length > 0 || invalidDimensions.length > 0) {
    reasons.push(
      `The interest score uses ${usedWeight} of ${totalWeight} available weight; missing and out-of-range answers are omitted rather than treated as zero.`,
    );
  }
  if (missingDimensions.length > 0) {
    reasons.push(`Missing interest responses: ${missingDimensions.join(", ")}.`);
  }
  if (invalidDimensions.length > 0) {
    reasons.push(
      `Out-of-range interest responses ignored: ${invalidDimensions.join(", ")}.`,
    );
  }

  return {
    score,
    evidenceCoverage,
    usedWeight,
    totalWeight,
    matchedDimensions: available.map(({ dimension }) => dimension),
    missingDimensions,
    invalidDimensions,
    reasons,
    improvementAreas: weakest
      ? [
          `${weakest.dimension} is the weakest answered relevant interest (${weakest.score.toFixed(1)}/100, weight ${weakest.weight}).`,
        ]
      : [],
    lowConfidence: evidenceCoverage < 0.5,
  };
}
