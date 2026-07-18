import { programs } from "../data/programs";
import type { DegreeProgram } from "../types/program";
import type {
  EligibleRecommendationResult,
  RecommendationBand,
  RecommendationConfidence,
  RecommendationResult,
  UnrankedRecommendationResult,
} from "../types/recommendation";
import type { StudentProfile } from "../types/student";
import { calculateAcademicScore } from "./academic-scoring";
import { calculateAptitudeScore } from "./aptitude-scoring";
import { evaluateEligibility } from "./eligibility-engine";
import { calculateInterestScore } from "./interest-scoring";

const FINAL_SCORE_WEIGHTS = {
  academic: 0.5,
  interest: 0.3,
  aptitude: 0.2,
} as const;

const ALIGNMENT_THRESHOLD = 12.5;
const LIMITED_EVIDENCE_THRESHOLD = 0.65;

export type InstitutionalFitWarningCode =
  | "field_not_offered_clinical_health"
  | "top_match_is_weak"
  | "insufficient_recommendation_evidence"
  | "no_eligible_programs";

export interface InstitutionalFitWarning {
  code: InstitutionalFitWarningCode;
  message: string;
}

export interface RecommendationEngineResult {
  recommendations: RecommendationResult[];
  eligibleRecommendations: EligibleRecommendationResult[];
  topFiveEligibleRecommendations: EligibleRecommendationResult[];
  verificationRequired: UnrankedRecommendationResult[];
  notEligible: UnrankedRecommendationResult[];
  institutionalFitWarnings: InstitutionalFitWarning[];
}

function compareRecommendationOrder(
  left: Pick<RecommendationResult, "finalScore" | "programName" | "programId">,
  right: Pick<RecommendationResult, "finalScore" | "programName" | "programId">,
): number {
  if (right.finalScore !== left.finalScore) {
    return right.finalScore - left.finalScore;
  }
  if (left.programName !== right.programName) {
    return left.programName < right.programName ? -1 : 1;
  }
  return left.programId < right.programId ? -1 : left.programId > right.programId ? 1 : 0;
}

export function getRecommendationBand(score: number): RecommendationBand {
  if (score >= 85) return "Excellent Match";
  if (score >= 75) return "Strong Match";
  if (score >= 65) return "Good Match";
  if (score >= 55) return "Moderate Match";
  return "Weak Match";
}

function validScoreRange(values: Array<number | undefined>): number | null {
  const validValues = values.filter(
    (value): value is number =>
      value !== undefined &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100,
  );

  if (validValues.length < 2) return null;
  return Math.max(...validValues) - Math.min(...validValues);
}

function isWeaklyDifferentiatedProfile(student: StudentProfile): boolean {
  const interestRange = validScoreRange(Object.values(student.interestScores));
  const aptitudeRange = validScoreRange(Object.values(student.aptitudeScores));

  return (
    interestRange !== null &&
    aptitudeRange !== null &&
    interestRange <= 30 &&
    aptitudeRange <= 25
  );
}

export function getRecommendationConfidence(
  componentScores: readonly [number, number, number],
  evidenceCoverage: number,
  weaklyDifferentiatedProfile = false,
): RecommendationConfidence {
  if (
    evidenceCoverage < LIMITED_EVIDENCE_THRESHOLD ||
    weaklyDifferentiatedProfile
  ) {
    return "Low";
  }

  const [academic, interest, aptitude] = componentScores;
  const differences = [
    Math.abs(academic - interest),
    Math.abs(academic - aptitude),
    Math.abs(interest - aptitude),
  ];

  if (Math.max(...differences) <= ALIGNMENT_THRESHOLD) return "High";
  if (differences.some((difference) => difference <= ALIGNMENT_THRESHOLD)) {
    return "Medium";
  }
  return "Low";
}

function unique(items: readonly string[]): string[] {
  return [...new Set(items)];
}

function buildImprovementAreas(
  components: ReadonlyArray<{
    name: "academic" | "interest" | "aptitude";
    score: number;
    evidenceCoverage: number;
    improvementAreas: string[];
  }>,
): string[] {
  const weakest = [...components].sort(
    (left, right) =>
      left.score - right.score || left.name.localeCompare(right.name),
  )[0];
  const limitedEvidence = components
    .filter(({ evidenceCoverage }) => evidenceCoverage < LIMITED_EVIDENCE_THRESHOLD)
    .map(
      ({ name }) =>
        `Provide more valid ${name} information to improve recommendation confidence.`,
    );

  return unique([...(weakest?.improvementAreas ?? []), ...limitedEvidence]);
}

function scoreProgram(
  program: DegreeProgram,
  student: StudentProfile,
): RecommendationResult {
  // Eligibility is deliberately evaluated first. The component calculations
  // below describe suitability and never change this status.
  const eligibility = evaluateEligibility(program, student);
  const academic = calculateAcademicScore(
    program.academicWeights,
    student.subjectMarks,
  );
  const interest = calculateInterestScore(
    program.interestWeights,
    student.interestScores,
  );
  const aptitude = calculateAptitudeScore(
    program.aptitudeWeights,
    student.aptitudeScores,
  );
  const finalScore =
    academic.score * FINAL_SCORE_WEIGHTS.academic +
    interest.score * FINAL_SCORE_WEIGHTS.interest +
    aptitude.score * FINAL_SCORE_WEIGHTS.aptitude;
  const evidenceCoverage =
    academic.evidenceCoverage * FINAL_SCORE_WEIGHTS.academic +
    interest.evidenceCoverage * FINAL_SCORE_WEIGHTS.interest +
    aptitude.evidenceCoverage * FINAL_SCORE_WEIGHTS.aptitude;
  const confidence = getRecommendationConfidence(
    [academic.score, interest.score, aptitude.score],
    evidenceCoverage,
    isWeaklyDifferentiatedProfile(student),
  );
  const reasons = unique([
    ...eligibility.explanations,
    ...academic.reasons,
    ...interest.reasons,
    ...aptitude.reasons,
  ]);
  const improvementAreas = buildImprovementAreas([
    {
      name: "academic",
      score: academic.score,
      evidenceCoverage: academic.evidenceCoverage,
      improvementAreas: academic.improvementAreas,
    },
    {
      name: "interest",
      score: interest.score,
      evidenceCoverage: interest.evidenceCoverage,
      improvementAreas: interest.improvementAreas,
    },
    {
      name: "aptitude",
      score: aptitude.score,
      evidenceCoverage: aptitude.evidenceCoverage,
      improvementAreas: aptitude.improvementAreas,
    },
  ]);
  const base = {
    programId: program.id,
    programName: program.name,
    academicScore: academic.score,
    interestScore: interest.score,
    aptitudeScore: aptitude.score,
    finalScore,
    recommendationBand: getRecommendationBand(finalScore),
    confidence,
    evidenceCoverage,
    reasons,
    improvementAreas,
  };

  if (eligibility.eligibilityStatus === "Eligible") {
    return {
      ...base,
      eligibilityStatus: "Eligible",
      rank: 0,
    };
  }

  return {
    ...base,
    eligibilityStatus: eligibility.eligibilityStatus,
    rank: null,
  };
}

function rankEligible(
  recommendations: readonly EligibleRecommendationResult[],
): EligibleRecommendationResult[] {
  return [...recommendations]
    .sort(compareRecommendationOrder)
    .map((recommendation, index) => ({
      ...recommendation,
      rank: index + 1,
    }));
}

function findSubjectPercentage(
  student: StudentProfile,
  subject: StudentProfile["subjectMarks"][number]["subject"],
): number | undefined {
  const value = student.subjectMarks.find(
    (mark) => mark.subject === subject,
  )?.calculatedPercentage;
  return value !== undefined &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
    ? value
    : undefined;
}

function buildInstitutionalFitWarnings(
  student: StudentProfile,
  eligibleRecommendations: readonly EligibleRecommendationResult[],
): InstitutionalFitWarning[] {
  const warnings: InstitutionalFitWarning[] = [];
  const biology = findSubjectPercentage(student, "Biology");
  const sportsInterest = student.interestScores["Sports/Fitness Interest"];
  const teachingInterest = student.interestScores["Teaching Interest"];
  const healthInterestAverage =
    sportsInterest !== undefined &&
    teachingInterest !== undefined &&
    sportsInterest >= 0 &&
    sportsInterest <= 100 &&
    teachingInterest >= 0 &&
    teachingInterest <= 100
      ? (sportsInterest + teachingInterest) / 2
      : null;

  if (
    student.intermediateGroup === "Pre-Medical" &&
    biology !== undefined &&
    biology >= 80 &&
    healthInterestAverage !== null &&
    healthInterestAverage >= 65
  ) {
    warnings.push({
      code: "field_not_offered_clinical_health",
      message:
        "This profile strongly suggests biology or health interests, but the current SIBAU knowledge base contains no medical or clinical degree. Listed programs should be treated as available alternatives, not close clinical matches.",
    });
  }

  const topRecommendation = eligibleRecommendations[0];
  if (!topRecommendation) {
    warnings.push({
      code: "no_eligible_programs",
      message:
        "No program currently has an Eligible result, so the current admission advertisement should be checked before interpreting suitability results.",
    });
    return warnings;
  }

  if (topRecommendation.finalScore < 55) {
    warnings.push({
      code: "top_match_is_weak",
      message:
        "Even the highest eligible suitability score is a Weak Match, so the available SIBAU programs may not closely fit this profile.",
    });
  }

  if (topRecommendation.evidenceCoverage < LIMITED_EVIDENCE_THRESHOLD) {
    warnings.push({
      code: "insufficient_recommendation_evidence",
      message:
        "The recommendation has limited valid academic or self-assessment evidence. Complete the missing information before relying on the ordering.",
    });
  }

  return warnings;
}

/**
 * Produces explainable suitability results after eligibility has been checked.
 * Suitability is calculated for every visible program, but only Eligible
 * programs receive ranks or appear in the eligible top five.
 */
export function generateRecommendations(
  student: StudentProfile,
  programData: readonly DegreeProgram[] = programs,
): RecommendationEngineResult {
  const scored = programData.map((program) => scoreProgram(program, student));
  const eligibleRecommendations = rankEligible(
    scored.filter(
      (result): result is EligibleRecommendationResult =>
        result.eligibilityStatus === "Eligible",
    ),
  );
  const verificationRequired = scored
    .filter(
      (result): result is UnrankedRecommendationResult =>
        result.eligibilityStatus === "Verification required",
    )
    .sort(compareRecommendationOrder);
  const notEligible = scored
    .filter(
      (result): result is UnrankedRecommendationResult =>
        result.eligibilityStatus === "Not eligible",
    )
    .sort(compareRecommendationOrder);

  return {
    recommendations: [
      ...eligibleRecommendations,
      ...verificationRequired,
      ...notEligible,
    ],
    eligibleRecommendations,
    topFiveEligibleRecommendations: eligibleRecommendations.slice(0, 5),
    verificationRequired,
    notEligible,
    institutionalFitWarnings: buildInstitutionalFitWarnings(
      student,
      eligibleRecommendations,
    ),
  };
}
