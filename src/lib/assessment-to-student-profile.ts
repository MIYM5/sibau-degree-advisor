import { availableSubjects, intermediateGroups } from "./assessment-form";
import {
  calculateAptitudeAssessment,
  type AptitudeResponses,
} from "./aptitude-assessment";
import {
  calculateInterestAssessment,
  type InterestResponses,
} from "./interest-assessment";
import { calculateBriefAptitudeAssessment } from "./brief-aptitude-assessment";
import type { BriefAptitudeResponse } from "../types/brief-aptitude";
import type { IntermediateGroup } from "../types/program";
import type { StudentProfile, SubjectMark } from "../types/student";

export interface CompletedAssessmentData {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: readonly SubjectMark[];
  interestResponses: InterestResponses;
  aptitudeResponses: AptitudeResponses;
}

export interface CompletedQuickAssessmentData {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: readonly SubjectMark[];
  aptitudeResponses: AptitudeResponses;
}

export interface CompletedDetailedAssessmentData {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: readonly SubjectMark[];
  aptitudeResponses: AptitudeResponses;
}

export interface CompletedVersion2AssessmentData {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: readonly SubjectMark[];
  briefAptitudeResponses: readonly BriefAptitudeResponse[];
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

/**
 * Creates the temporary Quick Guidance profile used by the unchanged
 * recommendation engine. Quick RIASEC evidence is deliberately not copied
 * into the Version 1 interest-score fields in this integration stage.
 */
function buildRiasecReviewOnlyStudentProfile(
  assessment: CompletedQuickAssessmentData | CompletedDetailedAssessmentData,
): StudentProfileBuildResult {
  const errors: string[] = [];

  if (assessment.name.trim().length === 0) {
    errors.push("Student name is required.");
  }
  if (!intermediateGroups.includes(assessment.intermediateGroup)) {
    errors.push("A valid Intermediate group is required.");
  }
  errors.push(...validateSubjectMarks(assessment.subjectMarks));

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
      interestScores: {},
      aptitudeScores: aptitudeAssessment.scores,
    },
  };
}

export function buildQuickStudentProfile(
  assessment: CompletedQuickAssessmentData,
): StudentProfileBuildResult {
  return buildRiasecReviewOnlyStudentProfile(assessment);
}

/**
 * Creates the temporary Detailed Guidance profile used by the unchanged
 * recommendation engine. Detailed RIASEC evidence remains review-only and is
 * deliberately not copied into the Version 1 interest-score fields.
 */
export function buildDetailedStudentProfile(
  assessment: CompletedDetailedAssessmentData,
): StudentProfileBuildResult {
  return buildRiasecReviewOnlyStudentProfile(assessment);
}

/**
 * Builds the current Version 2 profile while the new RIASEC and brief aptitude
 * evidence remains review-only. Neither result is copied into the legacy
 * StudentProfile scoring dimensions or sent to recommendation scoring.
 */
export function buildVersion2StudentProfile(
  assessment: CompletedVersion2AssessmentData,
): StudentProfileBuildResult {
  const errors: string[] = [];

  if (assessment.name.trim().length === 0) {
    errors.push("Student name is required.");
  }
  if (!intermediateGroups.includes(assessment.intermediateGroup)) {
    errors.push("A valid Intermediate group is required.");
  }
  errors.push(...validateSubjectMarks(assessment.subjectMarks));

  const briefAptitudeAssessment = calculateBriefAptitudeAssessment(
    assessment.briefAptitudeResponses,
  );
  if (!briefAptitudeAssessment.isValid) {
    errors.push("All five brief aptitude responses must be present and valid.");
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
      interestScores: {},
      aptitudeScores: {},
    },
  };
}
