import type { BriefAptitudeAssessmentResult } from "../types/brief-aptitude";

export interface BriefAptitudeScoringResult {
  score: number;
  evidenceCoverage: 1;
  evidenceLabel: "Limited";
  reasons: string[];
  improvementAreas: string[];
}

/**
 * Uses the five-task overall percentage as one limited indicator. It does not
 * invent program-specific or dimension-level aptitude precision.
 */
export function calculateBriefAptitudeScore(
  result: BriefAptitudeAssessmentResult,
): BriefAptitudeScoringResult {
  if (
    !result ||
    !result.isValid ||
    !result.isComplete ||
    result.confidenceLabel !== "Limited" ||
    result.evidenceCoverage.percentageCoverage !== 100
  ) {
    throw new RangeError(
      "A complete, valid five-task brief aptitude result is required.",
    );
  }

  const score = result.overallPercentage;
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(
      "Brief aptitude percentage must be finite and between 0 and 100.",
    );
  }

  return {
    score,
    evidenceCoverage: 1,
    evidenceLabel: "Limited",
    reasons: [
      `Brief aptitude indication is ${score.toFixed(1)}/100 from five tasks. It is limited evidence, not a complete measure of ability or a guarantee of success.`,
    ],
    improvementAreas:
      score < 40
        ? [
            "The brief task result is currently weak; use it as a prompt for further practice or fuller assessment, not as a final judgment of ability.",
          ]
        : [],
  };
}
