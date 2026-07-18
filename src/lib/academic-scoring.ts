import type { AcademicWeights, Subject } from "../types/program";
import type { SubjectMark } from "../types/student";

export interface AcademicScoringResult {
  score: number;
  evidenceCoverage: number;
  usedWeight: number;
  totalWeight: number;
  matchedSubjects: Subject[];
  missingSubjects: Subject[];
  invalidSubjects: Subject[];
  reasons: string[];
  improvementAreas: string[];
  lowConfidence: boolean;
}

interface WeightedSubjectScore {
  subject: Subject;
  score: number;
  weight: number;
}

const NEUTRAL_NO_EVIDENCE_SCORE = 50;

function isValidPercentage(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function positiveWeightEntries(
  weights: AcademicWeights,
): Array<[Subject, number]> {
  return Object.entries(weights).filter(
    (entry): entry is [Subject, number] =>
      Number.isFinite(entry[1]) && entry[1] > 0,
  );
}

function formatEvidence(items: readonly WeightedSubjectScore[]): string {
  return items
    .map(
      ({ subject, score, weight }) =>
        `${subject} (${score.toFixed(1)}%, weight ${weight})`,
    )
    .join(", ");
}

/**
 * Calculates academic suitability only. Hard subject requirements are checked
 * earlier by the eligibility engine and cannot be changed by this function.
 */
export function calculateAcademicScore(
  weights: AcademicWeights,
  subjectMarks: readonly SubjectMark[],
): AcademicScoringResult {
  const weightedSubjects = positiveWeightEntries(weights);
  const totalWeight = weightedSubjects.reduce(
    (sum, [, weight]) => sum + weight,
    0,
  );
  const marksBySubject = new Map(
    subjectMarks.map((mark) => [mark.subject, mark] as const),
  );
  const available: WeightedSubjectScore[] = [];
  const missingSubjects: Subject[] = [];
  const invalidSubjects: Subject[] = [];

  for (const [subject, weight] of weightedSubjects) {
    const mark = marksBySubject.get(subject);

    if (!mark) {
      missingSubjects.push(subject);
      continue;
    }

    if (!isValidPercentage(mark.calculatedPercentage)) {
      invalidSubjects.push(subject);
      continue;
    }

    available.push({
      subject,
      score: mark.calculatedPercentage,
      weight,
    });
  }

  const usedWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const evidenceCoverage = totalWeight > 0 ? usedWeight / totalWeight : 0;

  if (usedWeight === 0) {
    return {
      score: NEUTRAL_NO_EVIDENCE_SCORE,
      evidenceCoverage,
      usedWeight,
      totalWeight,
      matchedSubjects: [],
      missingSubjects,
      invalidSubjects,
      reasons: [
        "No valid mark was available for an academically weighted subject, so a neutral 50-point placeholder is used without claiming academic fit.",
      ],
      improvementAreas: [
        "Provide a valid mark for at least one academically relevant subject to improve confidence.",
      ],
      lowConfidence: true,
    };
  }

  const weightedTotal = available.reduce(
    (sum, item) => sum + item.score * item.weight,
    0,
  );
  const score = weightedTotal / usedWeight;
  const strongest = [...available]
    .sort(
      (left, right) =>
        right.score * right.weight - left.score * left.weight ||
        left.subject.localeCompare(right.subject),
    )
    .slice(0, 2);
  const weakest = [...available].sort(
    (left, right) =>
      left.score - right.score ||
      right.weight - left.weight ||
      left.subject.localeCompare(right.subject),
  )[0];
  const reasons = [
    `Academic suitability is based on studied subjects only and re-normalizes ${usedWeight} of ${totalWeight} available weight.`,
    `Strongest available academic evidence: ${formatEvidence(strongest)}.`,
  ];

  if (missingSubjects.length > 0) {
    reasons.push(
      `Unstudied preferred subjects were omitted rather than scored as zero: ${missingSubjects.join(", ")}.`,
    );
  }
  if (invalidSubjects.length > 0) {
    reasons.push(
      `Out-of-range academic percentages were ignored: ${invalidSubjects.join(", ")}.`,
    );
  }

  return {
    score,
    evidenceCoverage,
    usedWeight,
    totalWeight,
    matchedSubjects: available.map(({ subject }) => subject),
    missingSubjects,
    invalidSubjects,
    reasons,
    improvementAreas: weakest
      ? [
          `${weakest.subject} is the weakest available academically relevant subject (${weakest.score.toFixed(1)}%, weight ${weakest.weight}).`,
        ]
      : [],
    lowConfidence: evidenceCoverage < 0.5,
  };
}
