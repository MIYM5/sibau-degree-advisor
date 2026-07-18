import {
  aptitudeDimensionOrder,
  aptitudeQuestions,
  type AptitudeQuestion,
  type AptitudeQuestionId,
  type AptitudeResponseValue,
} from "../data/aptitude-questions";
import type { AptitudeDimension } from "../types/program";
import type { AptitudeScores } from "../types/student";

export type AptitudeResponses = Partial<Record<AptitudeQuestionId, number>>;
export type AptitudeLevel = "High" | "Moderate" | "Low";

export interface AptitudeDimensionResult {
  dimension: AptitudeDimension;
  score: number | null;
  evidenceCoverage: number;
  answeredQuestions: number;
  totalQuestions: number;
}

export interface AptitudeAssessmentResult {
  scores: AptitudeScores;
  dimensionResults: AptitudeDimensionResult[];
  missingQuestionIds: AptitudeQuestionId[];
  invalidQuestionIds: AptitudeQuestionId[];
  isComplete: boolean;
  isValid: boolean;
}

const responseScoreMap: Record<AptitudeResponseValue, number> = {
  1: 0,
  2: 25,
  3: 50,
  4: 75,
  5: 100,
};

export function isAptitudeResponseValue(
  value: number,
): value is AptitudeResponseValue {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function responseToAptitudeScore(
  response: AptitudeResponseValue,
): number {
  return responseScoreMap[response];
}

export function getAptitudeLevel(score: number): AptitudeLevel {
  if (score >= 75) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

export function calculateAptitudeAssessment(
  responses: AptitudeResponses,
  questions: readonly AptitudeQuestion[] = aptitudeQuestions,
): AptitudeAssessmentResult {
  const missingQuestionIds: AptitudeQuestionId[] = [];
  const invalidQuestionIds: AptitudeQuestionId[] = [];
  const scoresByDimension = new Map<AptitudeDimension, number[]>();
  const questionCounts = new Map<AptitudeDimension, number>();

  for (const question of questions) {
    questionCounts.set(
      question.dimension,
      (questionCounts.get(question.dimension) ?? 0) + 1,
    );
    const response = responses[question.id as AptitudeQuestionId];

    if (response === undefined) {
      missingQuestionIds.push(question.id as AptitudeQuestionId);
      continue;
    }
    if (!isAptitudeResponseValue(response)) {
      invalidQuestionIds.push(question.id as AptitudeQuestionId);
      continue;
    }

    const dimensionScores = scoresByDimension.get(question.dimension) ?? [];
    dimensionScores.push(responseToAptitudeScore(response));
    scoresByDimension.set(question.dimension, dimensionScores);
  }

  const scores: AptitudeScores = {};
  const dimensionResults = aptitudeDimensionOrder.map((dimension) => {
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
