import { aptitudeQuestions } from "../src/data/aptitude-questions";
import { interestQuestions } from "../src/data/interest-questions";
import { programs } from "../src/data/programs";
import {
  createRecommendationSessionPayload,
  parseRecommendationSessionPayload,
  type AssessmentSessionDraft,
} from "../src/lib/assessment-session";
import {
  buildStudentProfile,
  type CompletedAssessmentData,
} from "../src/lib/assessment-to-student-profile";
import { generateRecommendations } from "../src/lib/recommendation-engine";
import type { AptitudeResponses } from "../src/lib/aptitude-assessment";
import type { InterestResponses } from "../src/lib/interest-assessment";
import type { IntermediateGroup, Subject } from "../src/types/program";
import type { SubjectMark } from "../src/types/student";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function responses<T extends string>(
  questions: readonly { id: T; dimension: string }[],
  defaultValue: number,
  overrides: Readonly<Record<string, number>> = {},
): Partial<Record<T, number>> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      overrides[question.dimension] ?? defaultValue,
    ]),
  ) as Partial<Record<T, number>>;
}

function marks(
  percentages: Partial<Record<Subject, number>>,
): SubjectMark[] {
  return Object.entries(percentages).map(([subject, percentage]) => ({
    subject: subject as Subject,
    obtainedMarks: percentage,
    totalMarks: 100,
    calculatedPercentage: percentage,
  }));
}

function completedAssessment(
  name: string,
  intermediateGroup: IntermediateGroup,
  subjectMarks: SubjectMark[],
  interestOverrides: Readonly<Record<string, number>> = {},
  aptitudeOverrides: Readonly<Record<string, number>> = {},
): CompletedAssessmentData {
  return {
    name,
    intermediateGroup,
    subjectMarks,
    interestResponses: responses(
      interestQuestions,
      3,
      interestOverrides,
    ) as InterestResponses,
    aptitudeResponses: responses(
      aptitudeQuestions,
      3,
      aptitudeOverrides,
    ) as AptitudeResponses,
  };
}

function draftFromAssessment(
  assessment: CompletedAssessmentData,
): AssessmentSessionDraft {
  return {
    name: assessment.name,
    intermediateGroup: assessment.intermediateGroup,
    subjectRows: assessment.subjectMarks.map((mark) => ({
      ...mark,
      isOptional: false,
    })),
    interestResponses: assessment.interestResponses,
    aptitudeResponses: assessment.aptitudeResponses,
  };
}

const computingAssessment = completedAssessment(
  "  Sana Student  ",
  "Pre-Medical",
  marks({
    Biology: 82,
    Chemistry: 75,
    Physics: 80,
    "Computer Science": 85,
    English: 72,
  }),
  {
    "Coding Interest": 5,
    "Technology Interest": 5,
    "Problem Solving Interest": 5,
  },
  {
    "Logical Aptitude": 5,
    "Numerical Aptitude": 5,
    "Spatial/Technical Aptitude": 5,
  },
);

const engineeringAssessment = completedAssessment(
  "Ali Student",
  "ICS",
  marks({
    Mathematics: 90,
    Physics: 78,
    "Computer Science": 88,
    English: 74,
  }),
  {
    "Coding Interest": 5,
    "Technology Interest": 5,
    "Engineering/Hardware Interest": 5,
  },
  {
    "Logical Aptitude": 5,
    "Numerical Aptitude": 5,
    "Spatial/Technical Aptitude": 5,
  },
);

const healthAssessment = completedAssessment(
  "Ayesha Student",
  "Pre-Medical",
  marks({ Biology: 90, Chemistry: 84, Physics: 78, English: 74 }),
  {
    "Teaching Interest": 5,
    "Sports/Fitness Interest": 5,
  },
  { "Verbal/Communication Aptitude": 5 },
);

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Completed assessment converts to the existing StudentProfile shape",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      assert(built.profile.name === "Sana Student", "Name should be trimmed.");
      assert(
        built.profile.intermediateGroup === "Pre-Medical",
        "Intermediate group should be preserved.",
      );
    },
  },
  {
    name: "Interest responses map to the expected profile dimensions",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      assert(
        built.profile.interestScores["Coding Interest"] === 100,
        "Coding interest should map to 100.",
      );
      assert(
        built.profile.interestScores["Finance Interest"] === 50,
        "Neutral finance responses should map to 50.",
      );
    },
  },
  {
    name: "Aptitude responses map to the expected profile dimensions",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      assert(
        built.profile.aptitudeScores["Logical Aptitude"] === 100,
        "Logical aptitude should map to 100.",
      );
      assert(
        built.profile.aptitudeScores["Creative Aptitude"] === 50,
        "Neutral creative responses should map to 50.",
      );
    },
  },
  {
    name: "Subject marks preserve obtained, total, and percentage values",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const physics = built.profile.subjectMarks.find(
        ({ subject }) => subject === "Physics",
      );
      assert(physics, "Physics mark should be present.");
      assert(
        physics.obtainedMarks === 80 &&
          physics.totalMarks === 100 &&
          physics.calculatedPercentage === 80,
        "Physics values should be preserved.",
      );
    },
  },
  {
    name: "Recommendation engine accepts and evaluates the constructed profile",
    run: () => {
      const built = buildStudentProfile(engineeringAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const result = generateRecommendations(built.profile);
      assert(
        result.recommendations.length === programs.length,
        "The constructed profile should be evaluated against every program.",
      );
      assert(
        result.recommendations.every(({ programId }) =>
          programs.some(({ id }) => id === programId),
        ),
        "Every recommendation should reference the program knowledge base.",
      );
    },
  },
  {
    name: "Eligible recommendations are ranked deterministically",
    run: () => {
      const built = buildStudentProfile(engineeringAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const result = generateRecommendations(built.profile);
      assert(result.eligibleRecommendations.length > 0, "Expected eligible results.");
      assert(
        result.eligibleRecommendations.every(
          (recommendation, index) => recommendation.rank === index + 1,
        ),
        "Eligible ranks should be consecutive and start at one.",
      );
    },
  },
  {
    name: "Verification-required results remain unranked",
    run: () => {
      const built = buildStudentProfile(engineeringAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const result = generateRecommendations(built.profile);
      assert(
        result.verificationRequired.length > 0,
        "Expected at least one verification-required result.",
      );
      assert(
        result.verificationRequired.every(({ rank }) => rank === null),
        "Verification-required results must not receive ranks.",
      );
    },
  },
  {
    name: "Not-eligible results remain unranked",
    run: () => {
      const built = buildStudentProfile(engineeringAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const result = generateRecommendations(built.profile);
      assert(result.notEligible.length > 0, "Expected a not-eligible result.");
      assert(
        result.notEligible.every(({ rank }) => rank === null),
        "Not-eligible results must not receive ranks.",
      );
    },
  },
  {
    name: "Pre-Medical computing profile can receive CS, SE, and AI recommendations without Mathematics",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const eligibleIds = new Set(
        generateRecommendations(built.profile).eligibleRecommendations.map(
          ({ programId }) => programId,
        ),
      );
      for (const id of ["SIBAU-BSCS", "SIBAU-BSSE", "SIBAU-BSAI"] as const) {
        assert(eligibleIds.has(id), `${id} should be eligible without Mathematics.`);
      }
    },
  },
  {
    name: "Health-oriented Pre-Medical profile receives the institutional-fit warning",
    run: () => {
      const built = buildStudentProfile(healthAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const result = generateRecommendations(built.profile);
      assert(
        result.institutionalFitWarnings.some(
          ({ code }) => code === "field_not_offered_clinical_health",
        ),
        "Expected clinical-health institutional-fit warning.",
      );
    },
  },
  {
    name: "Invalid and incomplete assessment data is rejected",
    run: () => {
      const missingName = buildStudentProfile({
        ...computingAssessment,
        name: "   ",
      });
      assert(!missingName.isValid, "A blank name should be rejected.");

      const incompleteInterest = buildStudentProfile({
        ...computingAssessment,
        interestResponses: {},
      });
      assert(
        !incompleteInterest.isValid,
        "Missing interest answers should be rejected.",
      );
    },
  },
  {
    name: "Session payload validation accepts valid data and rejects malformed results",
    run: () => {
      const built = buildStudentProfile(computingAssessment);
      assert(built.isValid, "Expected completed assessment to be valid.");
      const draft = draftFromAssessment(computingAssessment);
      const recommendationResult = generateRecommendations(built.profile);
      const payload = createRecommendationSessionPayload(
        draft,
        built.profile,
        recommendationResult,
      );
      assert(
        parseRecommendationSessionPayload(JSON.stringify(payload)) !== null,
        "A valid session payload should be accepted.",
      );

      const malformed = JSON.parse(JSON.stringify(payload)) as {
        recommendationResult: { recommendations: unknown };
      };
      malformed.recommendationResult.recommendations = [{ rank: 999 }];
      assert(
        parseRecommendationSessionPayload(JSON.stringify(malformed)) === null,
        "Malformed recommendation data should be rejected.",
      );
      assert(
        parseRecommendationSessionPayload("not-json") === null,
        "Invalid JSON should be rejected.",
      );
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`Assessment integration validation passed (${tests.length} tests).`);
