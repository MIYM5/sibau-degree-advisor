import type {
  DegreeProgram,
  ProgramId,
  RequiredSubjectRule,
  Subject,
} from "../types/program";
import type { EligibilityStatus } from "../types/recommendation";
import type { StudentProfile, SubjectMark } from "../types/student";

const RESTRICTED_ENGINEERING_PROGRAM_IDS: readonly ProgramId[] = [
  "SIBAU-BEEE",
  "SIBAU-BECSE",
];

export type EligibilityReasonCode =
  | "eligibility_requirements_met"
  | "eligible_under_working_mvp_rule"
  | "overall_percentage_unavailable"
  | "overall_percentage_below_minimum"
  | "intermediate_group_not_allowed"
  | "required_subject_missing"
  | "required_subject_below_minimum"
  | "eligibility_rule_requires_verification";

export interface EligibilityResult {
  programId: ProgramId;
  programName: string;
  eligibilityStatus: EligibilityStatus;
  calculatedOverallPercentage: number | null;
  reasonCodes: EligibilityReasonCode[];
  explanations: string[];
}

interface EligibilityIssue {
  code: EligibilityReasonCode;
  explanation: string;
}

function isRestrictedEngineeringProgram(program: DegreeProgram): boolean {
  return RESTRICTED_ENGINEERING_PROGRAM_IDS.includes(program.id);
}

function isPreMedicalNonEngineering(
  program: DegreeProgram,
  student: StudentProfile,
): boolean {
  return (
    student.intermediateGroup === "Pre-Medical" &&
    !isRestrictedEngineeringProgram(program)
  );
}

function calculateOverallPercentage(student: StudentProfile): number | null {
  if (student.subjectMarks.length === 0) {
    return null;
  }

  let totalObtainedMarks = 0;
  let totalPossibleMarks = 0;

  for (const mark of student.subjectMarks) {
    if (
      !Number.isFinite(mark.obtainedMarks) ||
      !Number.isFinite(mark.totalMarks) ||
      mark.totalMarks <= 0
    ) {
      return null;
    }

    totalObtainedMarks += mark.obtainedMarks;
    totalPossibleMarks += mark.totalMarks;
  }

  return totalPossibleMarks > 0
    ? (totalObtainedMarks / totalPossibleMarks) * 100
    : null;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

function subjectsForRule(
  rule: RequiredSubjectRule,
  ignoreMathematics: boolean,
): Subject[] {
  return ignoreMathematics
    ? rule.subjects.filter((subject) => subject !== "Mathematics")
    : rule.subjects;
}

function evaluateRequiredSubjects(
  program: DegreeProgram,
  student: StudentProfile,
): { hardFailures: EligibilityIssue[]; verificationIssues: EligibilityIssue[] } {
  const hardFailures: EligibilityIssue[] = [];
  const verificationIssues: EligibilityIssue[] = [];
  const marksBySubject = new Map(
    student.subjectMarks.map((mark) => [mark.subject, mark] as const),
  );
  const ignoreMathematics = isPreMedicalNonEngineering(program, student);

  for (const rule of program.requiredSubjects) {
    const subjects = subjectsForRule(rule, ignoreMathematics);

    if (subjects.length === 0) {
      if (rule.subjects.length === 0) {
        verificationIssues.push({
          code: "eligibility_rule_requires_verification",
          explanation: `${program.name} contains an empty required-subject rule that must be verified.`,
        });
      }
      continue;
    }

    if (rule.requirement === "all") {
      for (const subject of subjects) {
        const mark = marksBySubject.get(subject);

        if (!mark) {
          hardFailures.push({
            code: "required_subject_missing",
            explanation: `${subject} is required for ${program.name}, but no mark was provided.`,
          });
          continue;
        }

        if (!Number.isFinite(mark.calculatedPercentage)) {
          verificationIssues.push({
            code: "eligibility_rule_requires_verification",
            explanation: `${subject} has an invalid calculated percentage and must be checked.`,
          });
          continue;
        }

        if (program.minimumSubjectPercentage === null) {
          verificationIssues.push({
            code: "eligibility_rule_requires_verification",
            explanation: `${program.name} requires ${subject}, but its subject threshold is missing.`,
          });
          continue;
        }

        if (mark.calculatedPercentage < program.minimumSubjectPercentage) {
          hardFailures.push({
            code: "required_subject_below_minimum",
            explanation: `${subject} is ${formatPercentage(mark.calculatedPercentage)}, below the required ${formatPercentage(program.minimumSubjectPercentage)} for ${program.name}.`,
          });
        }
      }
      continue;
    }

    const availableMarks = subjects
      .map((subject) => marksBySubject.get(subject))
      .filter((mark): mark is SubjectMark => mark !== undefined);

    if (availableMarks.length === 0) {
      hardFailures.push({
        code: "required_subject_missing",
        explanation: `${program.name} requires at least one of: ${subjects.join(" or ")}.`,
      });
      continue;
    }

    if (program.minimumSubjectPercentage === null) {
      verificationIssues.push({
        code: "eligibility_rule_requires_verification",
        explanation: `${program.name} has alternative required subjects, but its subject threshold is missing.`,
      });
      continue;
    }

    const validMarks = availableMarks.filter((mark) =>
      Number.isFinite(mark.calculatedPercentage),
    );

    if (validMarks.length !== availableMarks.length) {
      verificationIssues.push({
        code: "eligibility_rule_requires_verification",
        explanation: `A required-subject alternative for ${program.name} has an invalid calculated percentage.`,
      });
    }

    if (
      validMarks.length > 0 &&
      !validMarks.some(
        (mark) =>
          mark.calculatedPercentage >= program.minimumSubjectPercentage!,
      )
    ) {
      hardFailures.push({
        code: "required_subject_below_minimum",
        explanation: `None of the provided alternatives (${subjects.join(" or ")}) meets the required ${formatPercentage(program.minimumSubjectPercentage)} for ${program.name}.`,
      });
    }
  }

  return { hardFailures, verificationIssues };
}

function buildResult(
  program: DegreeProgram,
  eligibilityStatus: EligibilityStatus,
  calculatedOverallPercentage: number | null,
  issues: readonly EligibilityIssue[],
): EligibilityResult {
  return {
    programId: program.id,
    programName: program.name,
    eligibilityStatus,
    calculatedOverallPercentage,
    reasonCodes: issues.map((issue) => issue.code),
    explanations: issues.map((issue) => issue.explanation),
  };
}

/**
 * Evaluates admission eligibility only. Academic, interest, aptitude, final
 * scores, and ranking must be calculated later and in a separate module.
 */
export function evaluateEligibility(
  program: DegreeProgram,
  student: StudentProfile,
): EligibilityResult {
  const hardFailures: EligibilityIssue[] = [];
  const verificationIssues: EligibilityIssue[] = [];
  const overallPercentage = calculateOverallPercentage(student);
  const preMedicalNonEngineering = isPreMedicalNonEngineering(program, student);

  if (overallPercentage === null) {
    verificationIssues.push({
      code: "overall_percentage_unavailable",
      explanation:
        "An overall percentage could not be calculated from the supplied marks.",
    });
  } else if (program.minimumOverallPercentage === null) {
    verificationIssues.push({
      code: "eligibility_rule_requires_verification",
      explanation: `${program.name} does not have a stored overall minimum percentage.`,
    });
  } else if (overallPercentage < program.minimumOverallPercentage) {
    hardFailures.push({
      code: "overall_percentage_below_minimum",
      explanation: `The calculated overall percentage is ${formatPercentage(overallPercentage)}, below the required ${formatPercentage(program.minimumOverallPercentage)} for ${program.name}.`,
    });
  }

  if (program.requiredGroups.length === 0) {
    verificationIssues.push({
      code: "eligibility_rule_requires_verification",
      explanation: `${program.name} does not have a stored Intermediate-group rule.`,
    });
  } else {
    const groupAllowed =
      preMedicalNonEngineering ||
      program.requiredGroups.includes("Any Intermediate/F.Sc group") ||
      program.requiredGroups.includes(student.intermediateGroup);

    if (!groupAllowed) {
      hardFailures.push({
        code: "intermediate_group_not_allowed",
        explanation: `${student.intermediateGroup} is not an allowed Intermediate group for ${program.name}.`,
      });
    }
  }

  const subjectResult = evaluateRequiredSubjects(program, student);
  hardFailures.push(...subjectResult.hardFailures);
  verificationIssues.push(...subjectResult.verificationIssues);

  if (hardFailures.length > 0) {
    return buildResult(
      program,
      "Not eligible",
      overallPercentage,
      hardFailures,
    );
  }

  // These exact outcomes are explicit working MVP decisions in the approved
  // task, even when the underlying source still needs annual verification.
  const explicitWorkingMvpOutcome =
    preMedicalNonEngineering || isRestrictedEngineeringProgram(program);

  if (
    program.eligibilityClassification === "verification_required" &&
    !explicitWorkingMvpOutcome
  ) {
    verificationIssues.push({
      code: "eligibility_rule_requires_verification",
      explanation: `${program.name} meets its stored requirements, but the eligibility evidence must be verified against the current admission advertisement.`,
    });
  }

  if (verificationIssues.length > 0) {
    return buildResult(
      program,
      "Verification required",
      overallPercentage,
      verificationIssues,
    );
  }

  const eligibleIssue: EligibilityIssue = explicitWorkingMvpOutcome
    ? {
        code: "eligible_under_working_mvp_rule",
        explanation: preMedicalNonEngineering
          ? `Under the working MVP rule, Pre-Medical students are eligible for ${program.name} when the overall minimum is met; missing Mathematics does not create a non-engineering eligibility failure.`
          : `The student meets the stored restricted group, subject, and percentage requirements used for ${program.name} in the working MVP.`,
      }
    : {
        code: "eligibility_requirements_met",
        explanation: `The student meets the stored eligibility requirements for ${program.name}.`,
      };

  return buildResult(program, "Eligible", overallPercentage, [eligibleIssue]);
}

export function evaluateEligibilityForPrograms(
  programData: readonly DegreeProgram[],
  student: StudentProfile,
): EligibilityResult[] {
  return programData.map((program) => evaluateEligibility(program, student));
}
