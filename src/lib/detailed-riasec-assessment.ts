import { detailedRiasecQuestions } from "../data/detailed-riasec-questions";
import {
  createRiasecProfile,
  riasecDimensionLabels,
  riasecDimensionOrder,
  type RiasecDimension,
  type RiasecScores,
  type RiasecTopThree,
} from "../types/riasec";
import type {
  DetailedRiasecAssessmentResult,
  DetailedRiasecDimensionCoverage,
  DetailedRiasecQuestion,
  DetailedRiasecQuestionId,
  DetailedRiasecResponse,
  DetailedRiasecResponseValue,
  DetailedRiasecValidationError,
  DetailedRiasecValidationResult,
} from "../types/detailed-interest";

export const DETAILED_RIASEC_DISCLAIMER =
  "This project-designed assessment is informed by the RIASEC career-interest framework. It is not the official O*NET Interest Profiler and is not a validated psychometric assessment.";

export const detailedRiasecDimensionExplanations: Record<
  RiasecDimension,
  string
> = {
  realistic: "practical activities, tools, equipment, and applied systems",
  investigative: "analysis, research, evidence, and complex problem-solving",
  artistic: "creativity, communication, design, and original expression",
  social: "teaching, helping, cooperation, and people development",
  enterprising: "leadership, persuasion, initiative, and opportunity development",
  conventional: "organization, accuracy, records, finance, and structured procedures",
};

const responseScoreMap: Record<DetailedRiasecResponseValue, number> = {
  1: 0,
  2: 25,
  3: 50,
  4: 75,
  5: 100,
};

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

export function isDetailedRiasecResponseValue(
  value: unknown,
): value is DetailedRiasecResponseValue {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export function detailedRiasecResponseToScore(
  value: DetailedRiasecResponseValue,
): number {
  return responseScoreMap[value];
}

export function validateDetailedRiasecQuestions(
  questions: readonly DetailedRiasecQuestion[] = detailedRiasecQuestions,
): DetailedRiasecValidationError[] {
  const errors: DetailedRiasecValidationError[] = [];
  const questionIds = questions.map(({ id }) => id);
  if (new Set(questionIds).size !== questionIds.length) {
    errors.push({
      code: "duplicate_question_id",
      message: "Detailed RIASEC question IDs must be unique.",
    });
  }

  const orders = questions.map(({ displayOrder }) => displayOrder);
  const expectedOrders = Array.from(
    { length: questions.length },
    (_, index) => index + 1,
  );
  if (
    new Set(orders).size !== orders.length ||
    orders.some((order, index) => order !== expectedOrders[index])
  ) {
    errors.push({
      code: "invalid_question_order",
      message: "Detailed RIASEC question orders must be unique and sequential.",
    });
  }

  for (const dimension of riasecDimensionOrder) {
    const count = questions.filter(
      (question) => question.dimension === dimension,
    ).length;
    if (count !== 5) {
      errors.push({
        code: "invalid_dimension_coverage",
        dimension,
        message: `${riasecDimensionLabels[dimension]} must have exactly five questions.`,
      });
    }
  }

  return errors;
}

export function validateDetailedRiasecResponses(
  value: unknown,
  questions: readonly DetailedRiasecQuestion[] = detailedRiasecQuestions,
): DetailedRiasecValidationResult {
  const errors = validateDetailedRiasecQuestions(questions);
  const validResponses: DetailedRiasecResponse[] = [];
  const seenQuestionIds = new Set<string>();
  const validQuestionIds = new Set<string>();
  const questionById = new Map(questions.map((question) => [question.id, question]));

  if (!Array.isArray(value)) {
    errors.push({
      code: "malformed_responses",
      message: "Detailed RIASEC responses must be provided as a list.",
    });
  } else {
    for (const candidate of value) {
      if (!isRecord(candidate) || typeof candidate.questionId !== "string") {
        errors.push({
          code: "malformed_response",
          message: "A Detailed RIASEC response is malformed.",
        });
        continue;
      }

      const questionId = candidate.questionId;
      const question = questionById.get(questionId as DetailedRiasecQuestionId);
      if (!question) {
        errors.push({
          code: "unknown_question",
          questionId,
          message: `Unknown Detailed RIASEC question: ${questionId}.`,
        });
        continue;
      }
      if (seenQuestionIds.has(questionId)) {
        errors.push({
          code: "duplicate_question_response",
          questionId,
          message: `${questionId} has more than one response.`,
        });
        continue;
      }
      seenQuestionIds.add(questionId);

      if (typeof candidate.value !== "number" || !Number.isFinite(candidate.value)) {
        errors.push({
          code: "malformed_response",
          questionId,
          message: `${questionId} must have a numeric response.`,
        });
        continue;
      }
      if (!Number.isInteger(candidate.value)) {
        errors.push({
          code: "response_not_integer",
          questionId,
          message: `${questionId} response must be a whole number from 1 to 5.`,
        });
        continue;
      }
      if (candidate.value < 1 || candidate.value > 5) {
        errors.push({
          code: "response_out_of_range",
          questionId,
          message: `${questionId} response must be between 1 and 5.`,
        });
        continue;
      }

      validResponses.push({
        questionId: question.id,
        value: candidate.value as DetailedRiasecResponseValue,
      });
      validQuestionIds.add(questionId);
    }
  }

  const missingQuestionIds = questions
    .filter((question) => !validQuestionIds.has(question.id))
    .map(({ id }) => id);
  for (const questionId of missingQuestionIds) {
    errors.push({
      code: "missing_question",
      questionId,
      message: `${questionId} must be answered.`,
    });
  }

  validResponses.sort(
    (left, right) =>
      (questionById.get(left.questionId)?.displayOrder ?? 0) -
      (questionById.get(right.questionId)?.displayOrder ?? 0),
  );

  return {
    responses: validResponses,
    missingQuestionIds,
    errors,
    isComplete: missingQuestionIds.length === 0,
    isValid: missingQuestionIds.length === 0 && errors.length === 0,
  };
}

export function createDetailedRiasecProfileExplanation(
  topThree: RiasecTopThree,
): string {
  const descriptions = topThree.map(
    (dimension) =>
      `${riasecDimensionLabels[dimension]} interests in ${detailedRiasecDimensionExplanations[dimension]}`,
  );

  return `Your responses show the strongest activity preferences for ${descriptions[0]}, ${descriptions[1]}, and ${descriptions[2]}. This describes the activities you selected, not a diagnosis or fixed personality type.`;
}

export function calculateDetailedRiasecAssessment(
  value: unknown,
  questions: readonly DetailedRiasecQuestion[] = detailedRiasecQuestions,
): DetailedRiasecAssessmentResult {
  const validation = validateDetailedRiasecResponses(value, questions);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const dimensionScores = new Map<RiasecDimension, number[]>();

  for (const response of validation.responses) {
    const question = questionById.get(response.questionId);
    if (!question) continue;
    const scores = dimensionScores.get(question.dimension) ?? [];
    scores.push(detailedRiasecResponseToScore(response.value));
    dimensionScores.set(question.dimension, scores);
  }

  const scores = emptyScores();
  const perDimension = {} as Record<
    RiasecDimension,
    DetailedRiasecDimensionCoverage
  >;
  for (const dimension of riasecDimensionOrder) {
    const validScores = dimensionScores.get(dimension) ?? [];
    const totalQuestions = questions.filter(
      (question) => question.dimension === dimension,
    ).length;
    if (validScores.length > 0) {
      scores[dimension] =
        validScores.reduce((sum, score) => sum + score, 0) /
        validScores.length;
    }
    perDimension[dimension] = {
      dimension,
      answeredQuestions: validScores.length,
      totalQuestions,
      percentageCoverage:
        totalQuestions > 0 ? (validScores.length / totalQuestions) * 100 : 0,
    };
  }

  const answeredQuestions = validation.responses.length;
  const totalQuestions = questions.length;
  const profile = validation.isValid
    ? createRiasecProfile(scores, "Stronger interest evidence")
    : null;

  return {
    responses: validation.responses,
    scores,
    profile,
    profileExplanation: profile
      ? createDetailedRiasecProfileExplanation(profile.topThreeDimensions)
      : null,
    evidenceLabel: "Stronger interest evidence",
    evidenceCoverage: {
      answeredQuestions,
      totalQuestions,
      percentageCoverage:
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
      perDimension,
    },
    missingQuestionIds: validation.missingQuestionIds,
    errors: validation.errors,
    isComplete: validation.isComplete,
    isValid: validation.isValid,
  };
}

export function serializeDetailedRiasecResponses(
  responses: readonly DetailedRiasecResponse[],
): string {
  return JSON.stringify(responses);
}

export function parseDetailedRiasecResponses(
  serialized: string | null,
): DetailedRiasecResponse[] | null {
  if (serialized === null) return null;
  try {
    const result = calculateDetailedRiasecAssessment(JSON.parse(serialized));
    return result.isValid ? result.responses : null;
  } catch {
    return null;
  }
}
