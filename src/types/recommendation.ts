import type { ProgramId } from "./program";

export type EligibilityStatus =
  | "Eligible"
  | "Not eligible"
  | "Verification required";

interface RecommendationResultBase {
  programId: ProgramId;
  programName: string;
  academicScore: number;
  interestScore: number;
  aptitudeScore: number;
  finalScore: number;
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
