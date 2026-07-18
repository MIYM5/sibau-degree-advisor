import type { ProgramId } from "./program";

export const riasecDimensionOrder = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
] as const;

export type RiasecDimension = (typeof riasecDimensionOrder)[number];
export type RiasecDimensionCode = "R" | "I" | "A" | "S" | "E" | "C";
export type RiasecScores = Record<RiasecDimension, number>;
export type RiasecEvidenceLabel =
  | "Preliminary guidance"
  | "Stronger interest evidence";
export type HollandCode = `${RiasecDimensionCode}${RiasecDimensionCode}${RiasecDimensionCode}`;

export const riasecDimensionLabels: Record<RiasecDimension, string> = {
  realistic: "Realistic",
  investigative: "Investigative",
  artistic: "Artistic",
  social: "Social",
  enterprising: "Enterprising",
  conventional: "Conventional",
};

export const riasecDimensionCodes: Record<
  RiasecDimension,
  RiasecDimensionCode
> = {
  realistic: "R",
  investigative: "I",
  artistic: "A",
  social: "S",
  enterprising: "E",
  conventional: "C",
};

export type RiasecTopThree = readonly [
  RiasecDimension,
  RiasecDimension,
  RiasecDimension,
];

export interface RiasecProfile {
  scores: RiasecScores;
  topThreeDimensions: RiasecTopThree;
  hollandCode: HollandCode;
  topThreeLabels: readonly [string, string, string];
  evidenceLabel: RiasecEvidenceLabel;
}

export interface ProgramRiasecWeights {
  programId: ProgramId;
  weights: RiasecScores;
}

export function isRiasecScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

/**
 * Orders equal scores by the stable R-I-A-S-E-C dimension order so profile
 * codes remain reproducible across browsers and runs.
 */
export function getRiasecTopThree(scores: RiasecScores): RiasecTopThree {
  for (const dimension of riasecDimensionOrder) {
    if (!isRiasecScore(scores[dimension])) {
      throw new RangeError(
        `${riasecDimensionLabels[dimension]} score must be between 0 and 100.`,
      );
    }
  }

  const ordered = [...riasecDimensionOrder].sort((left, right) => {
    const scoreDifference = scores[right] - scores[left];
    if (scoreDifference !== 0) return scoreDifference;
    return (
      riasecDimensionOrder.indexOf(left) -
      riasecDimensionOrder.indexOf(right)
    );
  });

  return [ordered[0], ordered[1], ordered[2]];
}

export function createRiasecProfile(
  scores: RiasecScores,
  evidenceLabel: RiasecEvidenceLabel,
): RiasecProfile {
  const topThreeDimensions = getRiasecTopThree(scores);
  const topThreeLabels = topThreeDimensions.map(
    (dimension) => riasecDimensionLabels[dimension],
  ) as [string, string, string];
  const hollandCode = topThreeDimensions
    .map((dimension) => riasecDimensionCodes[dimension])
    .join("") as HollandCode;

  return {
    scores: { ...scores },
    topThreeDimensions,
    hollandCode,
    topThreeLabels,
    evidenceLabel,
  };
}
