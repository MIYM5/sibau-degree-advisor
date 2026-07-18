import { programs } from "../data/programs";
import { programRiasecWeights } from "../data/program-riasec-weights";
import type { DegreeProgram } from "../types/program";
import type {
  EligibleRecommendationResult,
  RecommendationBand,
  RecommendationConfidence,
  RecommendationResult,
  UnrankedRecommendationResult,
  Version2RecommendationInput,
  Version2RecommendationMetadata,
} from "../types/recommendation";
import type { StudentProfile } from "../types/student";
import { calculateAcademicScore } from "./academic-scoring";
import { calculateAptitudeScore } from "./aptitude-scoring";
import { evaluateEligibility } from "./eligibility-engine";
import { calculateInterestScore } from "./interest-scoring";
import { calculateBriefAptitudeScore } from "./brief-aptitude-scoring";
import { calculateRiasecInterestScore } from "./riasec-interest-scoring";

const FINAL_SCORE_WEIGHTS = {
  academic: 0.5,
  interest: 0.3,
  aptitude: 0.2,
} as const;

export const VERSION_2_SCORE_WEIGHTS = {
  quick: { academic: 0.55, interest: 0.3, aptitude: 0.15 },
  detailed: { academic: 0.5, interest: 0.35, aptitude: 0.15 },
} as const;

export const VERSION_2_SCORING_MODELS = {
  quick: "version-2-quick-55-30-15",
  detailed: "version-2-detailed-50-35-15",
} as const;

export const VERSION_2_QUESTIONNAIRE_VERSIONS = {
  quick: "version-2-quick-riasec-v1-brief-aptitude-v1",
  detailed: "version-2-detailed-riasec-v1-brief-aptitude-v1",
} as const;

export const LIMITED_APTITUDE_CONFIDENCE_NOTE =
  "The aptitude component is based on a brief five-task exercise and remains limited evidence.";

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

export interface Version2RecommendationEngineResult
  extends RecommendationEngineResult,
    Version2RecommendationMetadata {}

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

const programRiasecMappingById = new Map(
  programRiasecWeights.map((mapping) => [mapping.programId, mapping] as const),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertVersion2RecommendationInput(
  value: unknown,
): asserts value is Version2RecommendationInput {
  if (!isRecord(value) || value.version !== 2) {
    throw new TypeError("A Version 2 recommendation input is required.");
  }
  if (value.assessmentMode !== "quick" && value.assessmentMode !== "detailed") {
    throw new RangeError("Unknown Version 2 assessment mode.");
  }

  const mode = value.assessmentMode;
  if (value.scoringModelVersion !== VERSION_2_SCORING_MODELS[mode]) {
    throw new RangeError(
      `${mode} mode requires ${VERSION_2_SCORING_MODELS[mode]}.`,
    );
  }
  if (
    value.questionnaireVersion !== VERSION_2_QUESTIONNAIRE_VERSIONS[mode]
  ) {
    throw new RangeError(
      `${mode} mode requires ${VERSION_2_QUESTIONNAIRE_VERSIONS[mode]}.`,
    );
  }
  if (!isRecord(value.academicProfile)) {
    throw new TypeError("Version 2 academic profile is missing.");
  }
  if (!isRecord(value.riasecResult) || !isRecord(value.riasecResult.scores)) {
    throw new TypeError("Version 2 RIASEC evidence is missing.");
  }
  if (!isRecord(value.briefAptitudeResult)) {
    throw new TypeError("Version 2 brief aptitude evidence is missing.");
  }

  const expectedRiasecLabel =
    mode === "quick" ? "Preliminary" : "Stronger interest evidence";
  if (
    value.riasecEvidenceLabel !== expectedRiasecLabel ||
    value.riasecResult.evidenceLabel !== expectedRiasecLabel ||
    value.aptitudeEvidenceLabel !== "Limited" ||
    value.briefAptitudeResult.confidenceLabel !== "Limited"
  ) {
    throw new RangeError(
      "Version 2 evidence labels do not match the selected assessment mode.",
    );
  }
  if (
    value.riasecResult.isValid !== true ||
    value.riasecResult.isComplete !== true
  ) {
    throw new RangeError("Complete, valid Version 2 RIASEC evidence is required.");
  }
  if (
    (mode === "quick" && value.riasecResult.evidenceCoverage !== 1) ||
    (mode === "detailed" &&
      (!isRecord(value.riasecResult.evidenceCoverage) ||
        value.riasecResult.evidenceCoverage.percentageCoverage !== 100))
  ) {
    throw new RangeError("Version 2 RIASEC evidence coverage must be complete.");
  }
  if (
    value.briefAptitudeResult.isValid !== true ||
    value.briefAptitudeResult.isComplete !== true
  ) {
    throw new RangeError(
      "Complete, valid Version 2 brief aptitude evidence is required.",
    );
  }
}

function toEligibilityProfile(
  input: Version2RecommendationInput,
): StudentProfile {
  return {
    name: input.academicProfile.name,
    intermediateGroup: input.academicProfile.intermediateGroup,
    subjectMarks: input.academicProfile.subjectMarks,
    interestScores: {},
    aptitudeScores: {},
  };
}

function getVersion2Confidence(
  mode: Version2RecommendationInput["assessmentMode"],
  academicScore: number,
  interestScore: number,
  aptitudeScore: number,
  academicEvidenceCoverage: number,
): RecommendationConfidence {
  const academicInterestDifference = Math.abs(academicScore - interestScore);

  if (mode === "quick") {
    return academicEvidenceCoverage >= LIMITED_EVIDENCE_THRESHOLD &&
      academicInterestDifference <= 20 &&
      aptitudeScore >= 40
      ? "Medium"
      : "Low";
  }

  const componentRange =
    Math.max(academicScore, interestScore, aptitudeScore) -
    Math.min(academicScore, interestScore, aptitudeScore);
  if (
    academicEvidenceCoverage >= 0.999999 &&
    academicInterestDifference <= ALIGNMENT_THRESHOLD &&
    componentRange <= 25
  ) {
    return "High";
  }
  if (
    academicEvidenceCoverage >= LIMITED_EVIDENCE_THRESHOLD &&
    academicInterestDifference <= 20 &&
    aptitudeScore >= 20
  ) {
    return "Medium";
  }
  return "Low";
}

function scoreVersion2Program(
  program: DegreeProgram,
  input: Version2RecommendationInput,
  eligibilityProfile: StudentProfile,
): RecommendationResult {
  // Hard eligibility is deliberately evaluated before any suitability score.
  const eligibility = evaluateEligibility(program, eligibilityProfile);
  const academic = calculateAcademicScore(
    program.academicWeights,
    input.academicProfile.subjectMarks,
  );
  const mapping = programRiasecMappingById.get(program.id);
  if (!mapping) {
    throw new RangeError(`No reviewed RIASEC mapping exists for ${program.id}.`);
  }
  const interest = calculateRiasecInterestScore(
    input.riasecResult.scores,
    mapping,
  );
  const aptitude = calculateBriefAptitudeScore(input.briefAptitudeResult);
  const weights = VERSION_2_SCORE_WEIGHTS[input.assessmentMode];
  const finalScore =
    academic.score * weights.academic +
    interest.score * weights.interest +
    aptitude.score * weights.aptitude;
  if (!Number.isFinite(finalScore) || finalScore < 0 || finalScore > 100) {
    throw new RangeError("Version 2 final score must remain between 0 and 100.");
  }
  const evidenceCoverage =
    academic.evidenceCoverage * weights.academic +
    interest.evidenceCoverage * weights.interest +
    aptitude.evidenceCoverage * weights.aptitude;
  const confidence = getVersion2Confidence(
    input.assessmentMode,
    academic.score,
    interest.score,
    aptitude.score,
    academic.evidenceCoverage,
  );
  const confidenceNotes = [LIMITED_APTITUDE_CONFIDENCE_NOTE];
  const reasons = unique([
    ...eligibility.explanations,
    `Academic alignment is ${academic.score.toFixed(1)}/100 based on the available program-weighted subjects.`,
    ...academic.reasons,
    ...interest.reasons,
    ...aptitude.reasons,
    ...(confidence === "High" ? confidenceNotes : []),
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
    confidenceNotes,
  };

  return eligibility.eligibilityStatus === "Eligible"
    ? { ...base, eligibilityStatus: "Eligible", rank: 0 }
    : {
        ...base,
        eligibilityStatus: eligibility.eligibilityStatus,
        rank: null,
      };
}

function buildVersion2InstitutionalFitWarnings(
  input: Version2RecommendationInput,
  eligibleRecommendations: readonly EligibleRecommendationResult[],
): InstitutionalFitWarning[] {
  const warnings: InstitutionalFitWarning[] = [];
  const eligibilityProfile = toEligibilityProfile(input);
  const biology = findSubjectPercentage(eligibilityProfile, "Biology");
  const { social, investigative } = input.riasecResult.scores;

  if (
    input.academicProfile.intermediateGroup === "Pre-Medical" &&
    biology !== undefined &&
    biology >= 80 &&
    (social + investigative) / 2 >= 65
  ) {
    warnings.push({
      code: "field_not_offered_clinical_health",
      message:
        "This Pre-Medical profile combines strong Biology marks with people-focused and investigative interests, but the current SIBAU knowledge base contains no medical or clinical degree. Listed programs should be treated as available alternatives, not close clinical matches.",
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
        "The recommendation has limited valid academic evidence. Add relevant subject marks before relying on the ordering.",
    });
  }
  return warnings;
}

/**
 * Generates Version 2 recommendations from a strict mode-specific input.
 * Missing or mismatched RIASEC and brief aptitude evidence is rejected rather
 * than replaced with Version 1 neutral placeholders.
 */
export function generateVersion2Recommendations(
  value: unknown,
  programData: readonly DegreeProgram[] = programs,
): Version2RecommendationEngineResult {
  assertVersion2RecommendationInput(value);
  const input = value;
  // Validate both complete component inputs before evaluating any programs.
  calculateBriefAptitudeScore(input.briefAptitudeResult);
  calculateRiasecInterestScore(
    input.riasecResult.scores,
    programRiasecWeights[0],
  );

  const eligibilityProfile = toEligibilityProfile(input);
  const scored = programData.map((program) =>
    scoreVersion2Program(program, input, eligibilityProfile),
  );
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
  const componentWeights = VERSION_2_SCORE_WEIGHTS[input.assessmentMode];

  return {
    version: 2,
    assessmentMode: input.assessmentMode,
    scoringModelVersion: input.scoringModelVersion,
    questionnaireVersion: input.questionnaireVersion,
    riasecEvidenceLabel: input.riasecEvidenceLabel,
    aptitudeEvidenceLabel: input.aptitudeEvidenceLabel,
    componentWeights,
    recommendations: [
      ...eligibleRecommendations,
      ...verificationRequired,
      ...notEligible,
    ],
    eligibleRecommendations,
    topFiveEligibleRecommendations: eligibleRecommendations.slice(0, 5),
    verificationRequired,
    notEligible,
    institutionalFitWarnings: buildVersion2InstitutionalFitWarnings(
      input,
      eligibleRecommendations,
    ),
  };
}
