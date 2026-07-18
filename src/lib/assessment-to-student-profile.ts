import { availableSubjects, intermediateGroups } from "./assessment-form";
import {
  calculateAptitudeAssessment,
  type AptitudeResponses,
} from "./aptitude-assessment";
import {
  calculateInterestAssessment,
  type InterestResponses,
} from "./interest-assessment";
import type { IntermediateGroup } from "../types/program";
import type { StudentProfile, SubjectMark } from "../types/student";

export interface CompletedAssessmentData {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: readonly SubjectMark[];
  interestResponses: InterestResponses;
  aptitudeResponses: AptitudeResponses;
}

export type StudentProfileBuildResult =
  | { isValid: true; profile: StudentProfile; errors: [] }
  | { isValid: false; profile: null; errors: string[] };

function validateSubjectMarks(subjectMarks: readonly SubjectMark[]): string[] {
  const errors: string[] = [];
  const seenSubjects = new Set<string>();

  if (subjectMarks.length === 0) {
    errors.push("Enter at least one valid subject mark.");
    return errors;
  }

  for (const mark of subjectMarks) {
    if (!availableSubjects.includes(mark.subject)) {
      errors.push(`Unknown subject: ${String(mark.subject)}.`);
    }
    if (seenSubjects.has(mark.subject)) {
      errors.push(`Duplicate subject: ${mark.subject}.`);
    }
    seenSubjects.add(mark.subject);

    if (
      !Number.isFinite(mark.obtainedMarks) ||
      !Number.isFinite(mark.totalMarks) ||
      !Number.isFinite(mark.calculatedPercentage) ||
      mark.obtainedMarks < 0 ||
      mark.totalMarks <= 0 ||
      mark.obtainedMarks > mark.totalMarks
    ) {
      errors.push(`${mark.subject} contains invalid marks.`);
      continue;
    }

    const expectedPercentage =
      (mark.obtainedMarks / mark.totalMarks) * 100;
    if (Math.abs(expectedPercentage - mark.calculatedPercentage) > 0.000001) {
      errors.push(`${mark.subject} contains an inconsistent percentage.`);
    }
  }

  return errors;
}

/**
 * Validates a completed assessment and converts it to the existing domain
 * profile. Recommendation logic is deliberately not called from this module.
 */
export function buildStudentProfile(
  assessment: CompletedAssessmentData,
): StudentProfileBuildResult {
  const errors: string[] = [];

  if (assessment.name.trim().length === 0) {
    errors.push("Student name is required.");
  }
  if (!intermediateGroups.includes(assessment.intermediateGroup)) {
    errors.push("A valid Intermediate group is required.");
  }
  errors.push(...validateSubjectMarks(assessment.subjectMarks));

  const interestAssessment = calculateInterestAssessment(
    assessment.interestResponses,
  );
  if (!interestAssessment.isValid) {
    errors.push("All interest responses must be present and valid.");
  }

  const aptitudeAssessment = calculateAptitudeAssessment(
    assessment.aptitudeResponses,
  );
  if (!aptitudeAssessment.isValid) {
    errors.push("All aptitude responses must be present and valid.");
  }

  if (errors.length > 0) {
    return { isValid: false, profile: null, errors };
  }

  return {
    isValid: true,
    errors: [],
    profile: {
      name: assessment.name.trim(),
      intermediateGroup: assessment.intermediateGroup,
      subjectMarks: assessment.subjectMarks.map((mark) => ({ ...mark })),
      interestScores: interestAssessment.scores,
      aptitudeScores: aptitudeAssessment.scores,
    },
  };
}
