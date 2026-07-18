import {
  interestDimensionOrder,
  interestQuestions,
  type InterestQuestion,
  type InterestQuestionId,
  type InterestResponseValue,
} from "../data/interest-questions";
import type { InterestDimension } from "../types/program";
import type { InterestScores } from "../types/student";

export type InterestResponses = Partial<Record<InterestQuestionId, number>>;
export type InterestLevel = "High" | "Moderate" | "Low";

export interface InterestDimensionResult {
  dimension: InterestDimension;
  score: number | null;
  evidenceCoverage: number;
  answeredQuestions: number;
  totalQuestions: number;
}

export interface InterestAssessmentResult {
  scores: InterestScores;
  dimensionResults: InterestDimensionResult[];
  missingQuestionIds: InterestQuestionId[];
  invalidQuestionIds: InterestQuestionId[];
  isComplete: boolean;
  isValid: boolean;
}

const responseScoreMap: Record<InterestResponseValue, number> = {
  1: 0,
  2: 25,
  3: 50,
  4: 75,
  5: 100,
};

export function isInterestResponseValue(
  value: number,
): value is InterestResponseValue {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function responseToInterestScore(
  response: InterestResponseValue,
): number {
  return responseScoreMap[response];
}

export function getInterestLevel(score: number): InterestLevel {
  if (score >= 75) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

export function calculateInterestAssessment(
  responses: InterestResponses,
  questions: readonly InterestQuestion[] = interestQuestions,
): InterestAssessmentResult {
  const missingQuestionIds: InterestQuestionId[] = [];
  const invalidQuestionIds: InterestQuestionId[] = [];
  const scoresByDimension = new Map<InterestDimension, number[]>();
  const questionCounts = new Map<InterestDimension, number>();

  for (const question of questions) {
    questionCounts.set(
      question.dimension,
      (questionCounts.get(question.dimension) ?? 0) + 1,
    );
    const response = responses[question.id as InterestQuestionId];

    if (response === undefined) {
      missingQuestionIds.push(question.id as InterestQuestionId);
      continue;
    }
    if (!isInterestResponseValue(response)) {
      invalidQuestionIds.push(question.id as InterestQuestionId);
      continue;
    }

    const dimensionScores = scoresByDimension.get(question.dimension) ?? [];
    dimensionScores.push(responseToInterestScore(response));
    scoresByDimension.set(question.dimension, dimensionScores);
  }

  const scores: InterestScores = {};
  const dimensionResults = interestDimensionOrder.map((dimension) => {
    const validScores = scoresByDimension.get(dimension) ?? [];
    const totalQuestions = questionCounts.get(dimension) ?? 0;
    const score =
      validScores.length > 0
        ? validScores.reduce((sum, value) => sum + value, 0) /
          validScores.length
        : null;

    if (score !== null) scores[dimension] = score;

    return {
      dimension,
      score,
      evidenceCoverage:
        totalQuestions > 0 ? validScores.length / totalQuestions : 0,
      answeredQuestions: validScores.length,
      totalQuestions,
    };
  });

  return {
    scores,
    dimensionResults,
    missingQuestionIds,
    invalidQuestionIds,
    isComplete: missingQuestionIds.length === 0,
    isValid:
      missingQuestionIds.length === 0 && invalidQuestionIds.length === 0,
  };
}
