import type { IntermediateGroup, Subject } from "../types/program";
import type { SubjectMark } from "../types/student";

export const intermediateGroups = [
  "Pre-Engineering",
  "Pre-Medical",
  "ICS",
  "Commerce",
  "Arts/Humanities",
  "General Science",
  "Other",
] as const satisfies readonly IntermediateGroup[];

export const availableSubjects = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "English",
  "Biology",
  "Chemistry",
  "Accounting",
  "Economics",
  "General/Other",
] as const satisfies readonly Subject[];

const suggestedSubjects: Record<IntermediateGroup, readonly Subject[]> = {
  "Pre-Engineering": ["Mathematics", "Physics", "Chemistry", "English"],
  "Pre-Medical": ["Biology", "Chemistry", "Physics", "English"],
  ICS: ["Mathematics", "Computer Science", "Physics", "English"],
  Commerce: ["Accounting", "Economics", "Mathematics", "English"],
  "Arts/Humanities": ["English", "Economics", "General/Other"],
  "General Science": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
  ],
  Other: ["English", "General/Other"],
};

export interface SubjectMarkDraft extends Partial<SubjectMark> {
  isOptional: boolean;
}

export interface BasicInformationErrors {
  name?: string;
  intermediateGroup?: string;
}

export interface SubjectMarkRowErrors {
  subject?: string;
  obtainedMarks?: string;
  totalMarks?: string;
}

export interface SubjectMarksValidationResult {
  formError?: string;
  rowErrors: Record<number, SubjectMarkRowErrors>;
  isValid: boolean;
}

export function getSuggestedSubjectRows(
  group: IntermediateGroup,
): SubjectMarkDraft[] {
  return suggestedSubjects[group].map((subject) => ({
    subject,
    isOptional: false,
  }));
}

export function calculateSubjectPercentage(
  obtainedMarks: number | undefined,
  totalMarks: number | undefined,
): number | null {
  if (
    obtainedMarks === undefined ||
    totalMarks === undefined ||
    !Number.isFinite(obtainedMarks) ||
    !Number.isFinite(totalMarks) ||
    obtainedMarks < 0 ||
    totalMarks <= 0 ||
    obtainedMarks > totalMarks
  ) {
    return null;
  }

  return (obtainedMarks / totalMarks) * 100;
}

export function calculateOverallPercentage(
  subjectMarks: readonly SubjectMark[],
): number | null {
  const totalMarks = subjectMarks.reduce(
    (sum, mark) => sum + mark.totalMarks,
    0,
  );

  if (subjectMarks.length === 0 || totalMarks <= 0) return null;

  const obtainedMarks = subjectMarks.reduce(
    (sum, mark) => sum + mark.obtainedMarks,
    0,
  );
  return (obtainedMarks / totalMarks) * 100;
}

export function validateBasicInformation(
  name: string,
  intermediateGroup: IntermediateGroup | "",
): BasicInformationErrors {
  const errors: BasicInformationErrors = {};

  if (name.trim().length === 0) {
    errors.name = "Enter the student name to continue.";
  }
  if (!intermediateGroup) {
    errors.intermediateGroup = "Select an Intermediate group to continue.";
  }

  return errors;
}

export function validateSubjectMarkRows(
  rows: readonly SubjectMarkDraft[],
): SubjectMarksValidationResult {
  const rowErrors: Record<number, SubjectMarkRowErrors> = {};
  const subjectCounts = new Map<Subject, number>();

  rows.forEach((row) => {
    if (row.subject) {
      subjectCounts.set(row.subject, (subjectCounts.get(row.subject) ?? 0) + 1);
    }
  });

  rows.forEach((row, index) => {
    const errors: SubjectMarkRowErrors = {};

    if (!row.subject) {
      errors.subject = "Select a subject.";
    } else if ((subjectCounts.get(row.subject) ?? 0) > 1) {
      errors.subject = "Each subject can only be entered once.";
    }

    if (row.obtainedMarks === undefined || !Number.isFinite(row.obtainedMarks)) {
      errors.obtainedMarks = "Enter obtained marks.";
    } else if (row.obtainedMarks < 0) {
      errors.obtainedMarks = "Obtained marks cannot be negative.";
    }

    if (row.totalMarks === undefined || !Number.isFinite(row.totalMarks)) {
      errors.totalMarks = "Enter total marks.";
    } else if (row.totalMarks <= 0) {
      errors.totalMarks = "Total marks must be greater than zero.";
    }

    if (
      row.obtainedMarks !== undefined &&
      row.totalMarks !== undefined &&
      Number.isFinite(row.obtainedMarks) &&
      Number.isFinite(row.totalMarks) &&
      row.obtainedMarks > row.totalMarks
    ) {
      errors.obtainedMarks = "Obtained marks cannot exceed total marks.";
    }

    if (Object.keys(errors).length > 0) rowErrors[index] = errors;
  });

  const hasSubject = rows.some((row) => row.subject !== undefined);
  const formError = hasSubject
    ? undefined
    : "Enter marks for at least one subject.";

  return {
    formError,
    rowErrors,
    isValid: !formError && Object.keys(rowErrors).length === 0,
  };
}

export function toSubjectMarks(rows: readonly SubjectMarkDraft[]): SubjectMark[] {
  return rows.flatMap((row) => {
    const percentage = calculateSubjectPercentage(
      row.obtainedMarks,
      row.totalMarks,
    );

    if (
      !row.subject ||
      row.obtainedMarks === undefined ||
      row.totalMarks === undefined ||
      percentage === null
    ) {
      return [];
    }

    return [
      {
        subject: row.subject,
        obtainedMarks: row.obtainedMarks,
        totalMarks: row.totalMarks,
        calculatedPercentage: percentage,
      },
    ];
  });
}
