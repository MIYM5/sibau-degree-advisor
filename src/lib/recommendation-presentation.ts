import type { RecommendationSessionPayload } from "./assessment-session";
import type {
  InstitutionalFitWarning,
  RecommendationEngineResult,
} from "./recommendation-engine";
import {
  riasecDimensionLabels,
  riasecDimensionOrder,
  type RiasecDimension,
} from "../types/riasec";
import type {
  EligibleRecommendationResult,
  MeaningfulDifferenceLabel,
  PresentedEligibleRecommendation,
  RecommendationComponentWeights,
  UnrankedRecommendationResult,
} from "../types/recommendation";
import type { AcademicProfile } from "../types/recommendation";

export const SCORE_DIFFERENCE_GUIDANCE =
  "Small score differences should not be treated as proof that one program is definitively better than another.";

const riasecExplanationThemes: Record<RiasecDimension, string> = {
  realistic:
    "practical activities, equipment, tools, physical systems, and applied work",
  investigative:
    "analysis, research, evidence, technology, and complex problem-solving",
  artistic:
    "creativity, communication, visual design, and original expression",
  social:
    "teaching, helping, cooperation, guidance, and people development",
  enterprising:
    "leadership, persuasion, initiative, negotiation, and opportunity development",
  conventional:
    "organization, accuracy, records, finance, schedules, and structured procedures",
};

export interface RecommendationPresentation {
  topMatches: PresentedEligibleRecommendation[];
  alternativeOptions: PresentedEligibleRecommendation[];
  verificationRequired: UnrankedRecommendationResult[];
  notEligible: UnrankedRecommendationResult[];
  institutionalFitWarnings: InstitutionalFitWarning[];
  totalEligibleCount: number;
  additionalEligibleCount: number;
}

export interface RiasecProfilePresentation {
  hollandCode: string;
  topThreeDimensions: readonly RiasecDimension[];
  topThreeLabels: readonly string[];
  scores: ReadonlyArray<{
    dimension: RiasecDimension;
    label: string;
    score: number;
  }>;
  explanation: string;
  evidenceLabel: string;
}

export interface AptitudePresentation {
  totalCorrect: number;
  totalTasks: number;
  overallPercentage: number;
  evidenceLabel: "Limited";
  taskOutcomes: ReadonlyArray<{
    taskId: string;
    title: string;
    outcome: "Correct" | "Incorrect";
  }>;
}

export interface ProfileMethodologyPresentation {
  profile: AcademicProfile;
  assessmentLabel: "Quick Guidance" | "Detailed Guidance" | "Version 1 assessment";
  scoringModelVersion:
    | "version-1-custom-50-30-20"
    | "version-2-quick-55-30-15"
    | "version-2-detailed-50-35-15";
  componentWeights: RecommendationComponentWeights;
  interestEvidenceLabel: string;
  aptitudeEvidenceLabel: string;
  confidenceGuidance: string;
  riasec: RiasecProfilePresentation | null;
  aptitude: AptitudePresentation | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasRecommendationDisplayFields(
  value: Record<string, unknown>,
): boolean {
  return (
    typeof value.programId === "string" &&
    typeof value.programName === "string" &&
    isFiniteScore(value.academicScore) &&
    isFiniteScore(value.interestScore) &&
    isFiniteScore(value.aptitudeScore) &&
    isFiniteScore(value.finalScore) &&
    typeof value.recommendationBand === "string" &&
    (value.confidence === "Low" ||
      value.confidence === "Medium" ||
      value.confidence === "High") &&
    typeof value.evidenceCoverage === "number" &&
    Number.isFinite(value.evidenceCoverage) &&
    value.evidenceCoverage >= 0 &&
    value.evidenceCoverage <= 1 &&
    isStringArray(value.reasons) &&
    isStringArray(value.improvementAreas)
  );
}

function isEligibleRecommendation(
  value: unknown,
): value is EligibleRecommendationResult {
  return (
    isRecord(value) &&
    value.eligibilityStatus === "Eligible" &&
    Number.isInteger(value.rank) &&
    Number(value.rank) > 0 &&
    hasRecommendationDisplayFields(value)
  );
}

function isUnrankedRecommendation(
  value: unknown,
  status: "Verification required" | "Not eligible",
): value is UnrankedRecommendationResult {
  return (
    isRecord(value) &&
    value.eligibilityStatus === status &&
    value.rank === null &&
    hasRecommendationDisplayFields(value)
  );
}

function isWarning(value: unknown): value is InstitutionalFitWarning {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

export function getMeaningfulDifferenceLabel(
  difference: number,
): MeaningfulDifferenceLabel | null {
  if (!Number.isFinite(difference) || difference < 0) return null;
  if (difference < 3) return "Approximately equal match";
  if (difference < 7) return "Moderately stronger match";
  return "Clearly stronger match";
}

/**
 * Creates display groups from engine-ranked results without sorting, changing
 * ranks, or recalculating scores.
 */
export function buildRecommendationPresentation(
  value: unknown,
): RecommendationPresentation | null {
  if (!isRecord(value)) return null;
  const eligible = value.eligibleRecommendations;
  const verification = value.verificationRequired;
  const notEligible = value.notEligible;
  const warnings = value.institutionalFitWarnings;

  if (
    !Array.isArray(eligible) ||
    !eligible.every(isEligibleRecommendation) ||
    !Array.isArray(verification) ||
    !verification.every((item) =>
      isUnrankedRecommendation(item, "Verification required"),
    ) ||
    !Array.isArray(notEligible) ||
    !notEligible.every((item) =>
      isUnrankedRecommendation(item, "Not eligible"),
    ) ||
    !Array.isArray(warnings) ||
    !warnings.every(isWarning)
  ) {
    return null;
  }

  if (
    eligible.some((recommendation, index) => recommendation.rank !== index + 1)
  ) {
    return null;
  }

  const allIds = [
    ...eligible.map(({ programId }) => programId),
    ...verification.map(({ programId }) => programId),
    ...notEligible.map(({ programId }) => programId),
  ];
  if (new Set(allIds).size !== allIds.length) return null;

  const presented = eligible.slice(0, 5).map((recommendation, index) => {
    const previous = eligible[index - 1];
    if (!previous) {
      return { recommendation, comparisonWithPrevious: null };
    }
    const difference = Math.abs(
      previous.finalScore - recommendation.finalScore,
    );
    const label = getMeaningfulDifferenceLabel(difference);
    if (!label) return { recommendation, comparisonWithPrevious: null };
    return {
      recommendation,
      comparisonWithPrevious: { difference, label },
    };
  });

  return {
    topMatches: presented.slice(0, 3),
    alternativeOptions: presented.slice(3, 5),
    verificationRequired: [...verification],
    notEligible: [...notEligible],
    institutionalFitWarnings: [...warnings],
    totalEligibleCount: eligible.length,
    additionalEligibleCount: Math.max(0, eligible.length - 5),
  };
}

export function createRiasecExplanation(
  topThree: readonly RiasecDimension[],
): string | null {
  if (
    topThree.length !== 3 ||
    new Set(topThree).size !== 3 ||
    topThree.some(
      (dimension) => !riasecDimensionOrder.includes(dimension),
    )
  ) {
    return null;
  }

  const descriptions = topThree.map(
    (dimension) =>
      `${riasecDimensionLabels[dimension]} interests in ${riasecExplanationThemes[dimension]}`,
  );
  return `Your strongest reported themes are ${descriptions[0]}, ${descriptions[1]}, and ${descriptions[2]}. This describes your current responses and is not a fixed judgment about your future.`;
}

export function buildProfileMethodologyPresentation(
  payload: RecommendationSessionPayload,
): ProfileMethodologyPresentation | null {
  if (payload.version === 1) {
    return {
      profile: {
        name: payload.studentProfile.name,
        intermediateGroup: payload.studentProfile.intermediateGroup,
        subjectMarks: payload.studentProfile.subjectMarks,
      },
      assessmentLabel: "Version 1 assessment",
      scoringModelVersion: "version-1-custom-50-30-20",
      componentWeights: { academic: 0.5, interest: 0.3, aptitude: 0.2 },
      interestEvidenceLabel: "Legacy interest self-assessment",
      aptitudeEvidenceLabel: "Legacy aptitude self-assessment",
      confidenceGuidance:
        "Version 1 confidence uses the legacy interest and aptitude self-assessments. It remains educational guidance, not an admission or psychometric result.",
      riasec: null,
      aptitude: null,
    };
  }

  const input = payload.recommendationInput;
  const profile = input.riasecResult.profile;
  const explanation = profile
    ? createRiasecExplanation(profile.topThreeDimensions)
    : null;
  if (!profile || !explanation) return null;

  return {
    profile: input.academicProfile,
    assessmentLabel:
      input.assessmentMode === "quick" ? "Quick Guidance" : "Detailed Guidance",
    scoringModelVersion: input.scoringModelVersion,
    componentWeights: payload.recommendationResult.componentWeights,
    interestEvidenceLabel: input.riasecEvidenceLabel,
    aptitudeEvidenceLabel: input.aptitudeEvidenceLabel,
    confidenceGuidance:
      input.assessmentMode === "quick"
        ? "Quick Guidance confidence never exceeds Medium because its interest evidence is preliminary and its five-task aptitude evidence is limited."
        : "Detailed Guidance may show Low, Medium, or High confidence, but the five-task aptitude component remains limited evidence even when confidence is High.",
    riasec: {
      hollandCode: profile.hollandCode,
      topThreeDimensions: profile.topThreeDimensions,
      topThreeLabels: profile.topThreeLabels,
      scores: riasecDimensionOrder.map((dimension) => ({
        dimension,
        label: riasecDimensionLabels[dimension],
        score: profile.scores[dimension],
      })),
      explanation,
      evidenceLabel: input.riasecEvidenceLabel,
    },
    aptitude: {
      totalCorrect: input.briefAptitudeResult.totalCorrect,
      totalTasks: input.briefAptitudeResult.totalTasks,
      overallPercentage: input.briefAptitudeResult.overallPercentage,
      evidenceLabel: "Limited",
      taskOutcomes: input.briefAptitudeResult.taskResults.map((task) => ({
        taskId: task.taskId,
        title: task.taskTitle,
        outcome: task.isCorrect ? "Correct" : "Incorrect",
      })),
    },
  };
}

export function isPresentationCompatibleEngineResult(
  value: RecommendationEngineResult,
): boolean {
  return buildRecommendationPresentation(value) !== null;
}
