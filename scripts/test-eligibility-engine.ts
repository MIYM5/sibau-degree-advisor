import { programs } from "../src/data/programs";
import {
  evaluateEligibility,
  type EligibilityReasonCode,
} from "../src/lib/eligibility-engine";
import type { ProgramId, Subject } from "../src/types/program";
import type { EligibilityStatus } from "../src/types/recommendation";
import type { StudentProfile, SubjectMark } from "../src/types/student";

interface TestExpectation {
  label: string;
  description: string;
  programId: ProgramId;
  student: StudentProfile;
  expectedStatus: EligibilityStatus;
  expectedReason?: EligibilityReasonCode;
}

function subjectMark(subject: Subject, percentage: number): SubjectMark {
  return {
    subject,
    obtainedMarks: percentage,
    totalMarks: 100,
    calculatedPercentage: percentage,
  };
}

function student(
  intermediateGroup: StudentProfile["intermediateGroup"],
  marks: readonly [Subject, number][],
): StudentProfile {
  return {
    name: "Test Student",
    intermediateGroup,
    subjectMarks: marks.map(([subject, percentage]) =>
      subjectMark(subject, percentage),
    ),
    interestScores: {},
    aptitudeScores: {},
  };
}

function program(programId: ProgramId) {
  const match = programs.find((candidate) => candidate.id === programId);

  if (!match) {
    throw new Error(`Test program not found: ${programId}`);
  }

  return match;
}

const preMedicalMarks: readonly [Subject, number][] = [
  ["Biology", 82],
  ["Chemistry", 78],
  ["Physics", 75],
  ["English", 72],
];

const tests: TestExpectation[] = [
  {
    label: "A",
    description: "ICS student eligible for BE Computer Systems Engineering",
    programId: "SIBAU-BECSE",
    student: student("ICS", [
      ["Mathematics", 75],
      ["Computer Science", 80],
      ["English", 70],
    ]),
    expectedStatus: "Eligible",
  },
  {
    label: "B",
    description: "Pre-Engineering student eligible for BE Electrical Engineering",
    programId: "SIBAU-BEEE",
    student: student("Pre-Engineering", [
      ["Mathematics", 78],
      ["Physics", 74],
      ["Chemistry", 68],
      ["English", 70],
    ]),
    expectedStatus: "Eligible",
  },
  {
    label: "C",
    description: "Pre-Medical student not eligible for BE Electrical Engineering",
    programId: "SIBAU-BEEE",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Not eligible",
    expectedReason: "intermediate_group_not_allowed",
  },
  {
    label: "D",
    description:
      "Pre-Medical student not eligible for BE Computer Systems Engineering",
    programId: "SIBAU-BECSE",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Not eligible",
    expectedReason: "intermediate_group_not_allowed",
  },
  {
    label: "E",
    description: "Pre-Medical student eligible for BS Computer Science",
    programId: "SIBAU-BSCS",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Eligible",
  },
  {
    label: "F",
    description: "Pre-Medical student eligible for BS Software Engineering",
    programId: "SIBAU-BSSE",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Eligible",
  },
  {
    label: "G",
    description: "Pre-Medical student eligible for BS Artificial Intelligence",
    programId: "SIBAU-BSAI",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Eligible",
  },
  {
    label: "H",
    description: "Pre-Medical student eligible for BS Mathematics",
    programId: "SIBAU-BSMATH",
    student: student("Pre-Medical", preMedicalMarks),
    expectedStatus: "Eligible",
  },
  {
    label: "I",
    description: "Student below overall minimum",
    programId: "SIBAU-BSCS",
    student: student("ICS", [
      ["Mathematics", 40],
      ["Computer Science", 42],
      ["English", 38],
    ]),
    expectedStatus: "Not eligible",
    expectedReason: "overall_percentage_below_minimum",
  },
  {
    label: "J",
    description: "Student missing a genuinely required engineering subject",
    programId: "SIBAU-BEEE",
    student: student("Pre-Engineering", [
      ["Mathematics", 80],
      ["Chemistry", 72],
      ["English", 70],
    ]),
    expectedStatus: "Not eligible",
    expectedReason: "required_subject_missing",
  },
  {
    label: "K",
    description:
      "Student satisfies the Physics-or-Computer-Science alternative for Computer Systems Engineering",
    programId: "SIBAU-BECSE",
    student: student("Pre-Engineering", [
      ["Mathematics", 72],
      ["Physics", 68],
      ["English", 70],
    ]),
    expectedStatus: "Eligible",
  },
  {
    label: "L",
    description: "Program evidence classification requires verification",
    programId: "SIBAU-BBA",
    student: student("Commerce", [
      ["Accounting", 76],
      ["Economics", 72],
      ["English", 70],
    ]),
    expectedStatus: "Verification required",
    expectedReason: "eligibility_rule_requires_verification",
  },
];

let passed = 0;

for (const test of tests) {
  const result = evaluateEligibility(program(test.programId), test.student);

  if (result.eligibilityStatus !== test.expectedStatus) {
    throw new Error(
      `${test.label} failed: expected ${test.expectedStatus}, received ${result.eligibilityStatus}. ${result.explanations.join(" ")}`,
    );
  }

  if (
    test.expectedReason &&
    !result.reasonCodes.includes(test.expectedReason)
  ) {
    throw new Error(
      `${test.label} failed: expected reason ${test.expectedReason}, received ${result.reasonCodes.join(", ")}.`,
    );
  }

  if (result.explanations.length === 0) {
    throw new Error(`${test.label} failed: no user-friendly explanation returned.`);
  }

  passed += 1;
  console.log(
    `${test.label} PASS — ${test.description}: ${result.eligibilityStatus}`,
  );
}

console.log(`Eligibility engine tests passed: ${passed}/${tests.length}.`);
