import type { ProgramId } from "./program";

export type EligibilityStatus =
  | "Eligible"
  | "Not eligible"
  | "Verification required";

export type RecommendationBand =
  | "Excellent Match"
  | "Strong Match"
  | "Good Match"
  | "Moderate Match"
  | "Weak Match";

export type RecommendationConfidence = "High" | "Medium" | "Low";

interface RecommendationResultBase {
  programId: ProgramId;
  programName: string;
  academicScore: number;
  interestScore: number;
  aptitudeScore: number;
  finalScore: number;
  recommendationBand: RecommendationBand;
  confidence: RecommendationConfidence;
  evidenceCoverage: number;
  reasons: string[];
  improvementAreas: string[];
}

export interface EligibleRecommendationResult
  extends RecommendationResultBase {
  eligibilityStatus: "Eligible";
  rank: number;
}

export interface UnrankedRecommendationResult
  extends RecommendationResultBase {
  eligibilityStatus: Exclude<EligibilityStatus, "Eligible">;
  rank: null;
}

/**
 * Only eligible programs receive a numeric rank. Not-eligible and
 * verification-required programs remain visible but unranked.
 */
export type RecommendationResult =
  | EligibleRecommendationResult
  | UnrankedRecommendationResult;
