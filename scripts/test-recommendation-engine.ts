import { programs } from "../src/data/programs";
import { calculateAcademicScore } from "../src/lib/academic-scoring";
import { calculateAptitudeScore } from "../src/lib/aptitude-scoring";
import { calculateInterestScore } from "../src/lib/interest-scoring";
import { generateRecommendations } from "../src/lib/recommendation-engine";
import type {
  AptitudeScores,
  InterestScores,
  StudentProfile,
} from "../src/types/student";
import type {
  AptitudeDimension,
  InterestDimension,
  IntermediateGroup,
  ProgramId,
  Subject,
} from "../src/types/program";

const interestDimensions: readonly InterestDimension[] = [
  "Coding Interest",
  "Technology Interest",
  "Problem Solving Interest",
  "Business Interest",
  "Agriculture Interest",
  "Finance Interest",
  "Media/Creative Interest",
  "Teaching Interest",
  "Sports/Fitness Interest",
  "Engineering/Hardware Interest",
  "Mathematics/Research Interest",
];

const aptitudeDimensions: readonly AptitudeDimension[] = [
  "Logical Aptitude",
  "Numerical Aptitude",
  "Verbal/Communication Aptitude",
  "Creative Aptitude",
  "Spatial/Technical Aptitude",
  "Leadership/Social Aptitude",
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function marks(values: Partial<Record<Subject, number>>) {
  return Object.entries(values).map(([subject, percentage]) => ({
    subject: subject as Subject,
    obtainedMarks: percentage,
    totalMarks: 100,
    calculatedPercentage: percentage,
  }));
}

function dimensionScores<T extends string>(
  dimensions: readonly T[],
  values: readonly number[],
): Partial<Record<T, number>> {
  return Object.fromEntries(
    dimensions.map((dimension, index) => [dimension, values[index]]),
  ) as Partial<Record<T, number>>;
}

function profile(
  name: string,
  intermediateGroup: IntermediateGroup,
  subjectPercentages: Partial<Record<Subject, number>>,
  interestValues: readonly number[],
  aptitudeValues: readonly number[],
): StudentProfile {
  return {
    name,
    intermediateGroup,
    subjectMarks: marks(subjectPercentages),
    interestScores: dimensionScores(interestDimensions, interestValues),
    aptitudeScores: dimensionScores(aptitudeDimensions, aptitudeValues),
  };
}

const testProfiles = {
  A: profile(
    "Strong Computing Student",
    "ICS",
    {
      Mathematics: 90,
      Physics: 75,
      "Computer Science": 88,
      English: 72,
      "General/Other": 70,
    },
    [95, 90, 85, 35, 20, 30, 30, 35, 40, 55, 82],
    [88, 84, 72, 55, 76, 65],
  ),
  B: profile(
    "Biology and Health-Oriented Student",
    "Pre-Medical",
    {
      Physics: 78,
      English: 74,
      Biology: 90,
      Chemistry: 84,
      "General/Other": 72,
    },
    [20, 35, 55, 45, 25, 20, 25, 65, 75, 20, 35],
    [60, 58, 75, 55, 48, 70],
  ),
  C: profile(
    "Commerce and Finance Student",
    "Commerce",
    {
      Mathematics: 82,
      English: 75,
      Accounting: 89,
      Economics: 80,
      "General/Other": 74,
    },
    [15, 25, 72, 88, 25, 92, 25, 35, 20, 15, 65],
    [72, 85, 74, 45, 50, 78],
  ),
  D: profile(
    "Engineering and Hardware Student",
    "Pre-Engineering",
    {
      Mathematics: 88,
      Physics: 86,
      "Computer Science": 72,
      English: 68,
      Chemistry: 75,
      "General/Other": 70,
    },
    [55, 72, 88, 25, 20, 20, 15, 25, 35, 95, 82],
    [84, 87, 62, 42, 92, 60],
  ),
  E: profile(
    "Pre-Medical Student with Strong Computing Interest",
    "Pre-Medical",
    {
      Physics: 80,
      "Computer Science": 85,
      English: 72,
      Biology: 82,
      Chemistry: 75,
      "General/Other": 70,
    },
    [95, 92, 90, 25, 20, 20, 20, 25, 20, 45, 75],
    [90, 82, 70, 55, 75, 60],
  ),
  F: profile(
    "Broad but Weakly Differentiated Student",
    "Arts/Humanities",
    { English: 68, Economics: 58, "General/Other": 65 },
    [35, 40, 45, 50, 35, 40, 55, 55, 45, 25, 35],
    [48, 45, 60, 62, 40, 58],
  ),
} as const;

function ids(results: ReadonlyArray<{ programId: ProgramId }>): ProgramId[] {
  return results.map(({ programId }) => programId);
}

function allScoresAreValid(student: StudentProfile): boolean {
  return generateRecommendations(student).recommendations.every((result) =>
    [
      result.academicScore,
      result.interestScore,
      result.aptitudeScore,
      result.finalScore,
    ].every((score) => Number.isFinite(score) && score >= 0 && score <= 100),
  );
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "A. Strong computing profile places at least three computing programs in the eligible top five",
    run: () => {
      const result = generateRecommendations(testProfiles.A);
      const topIds = new Set(ids(result.topFiveEligibleRecommendations));
      const computingIds: ProgramId[] = [
        "SIBAU-BSCS",
        "SIBAU-BSSE",
        "SIBAU-BSAI",
        "SIBAU-BECSE",
      ];
      assert(
        computingIds.filter((id) => topIds.has(id)).length >= 3,
        `Expected at least three computing programs, received ${[...topIds].join(", ")}`,
      );
      assert(allScoresAreValid(testProfiles.A), "Every score must be within 0-100.");
    },
  },
  {
    name: "B. Health-oriented Pre-Medical profile keeps non-engineering programs eligible and warns about clinical fit",
    run: () => {
      const result = generateRecommendations(testProfiles.B);
      assert(result.eligibleRecommendations.length === 12, "Expected all 12 non-engineering programs to be eligible.");
      assert(
        ids(result.notEligible).includes("SIBAU-BEEE") &&
          ids(result.notEligible).includes("SIBAU-BECSE"),
        "Both restricted engineering programs must be Not eligible.",
      );
      assert(
        result.institutionalFitWarnings.some(
          ({ code }) => code === "field_not_offered_clinical_health",
        ),
        "Expected a clinical/health institutional-fit warning.",
      );
    },
  },
  {
    name: "C. Commerce profile gives finance, economics and BBA high suitability while preserving verification status",
    run: () => {
      const result = generateRecommendations(testProfiles.C);
      const highestSuitability = [...result.recommendations]
        .sort(
          (left, right) =>
            right.finalScore - left.finalScore ||
            left.programName.localeCompare(right.programName),
        )
        .slice(0, 4);
      const topIds = new Set(ids(highestSuitability));
      for (const expected of [
        "SIBAU-BSAF",
        "SIBAU-BSECO",
        "SIBAU-BBA",
      ] as const) {
        assert(topIds.has(expected), `${expected} should be among the four highest suitability scores.`);
      }
      assert(
        result.verificationRequired.some(({ programId }) => programId === "SIBAU-BSAF"),
        "Accounting & Finance must remain unranked while its eligibility evidence requires verification.",
      );
    },
  },
  {
    name: "D. Engineering profile places both restricted engineering programs near the top",
    run: () => {
      const result = generateRecommendations(testProfiles.D);
      const topIds = new Set(ids(result.topFiveEligibleRecommendations));
      assert(topIds.has("SIBAU-BEEE"), "BE Electrical Engineering should be in the eligible top five.");
      assert(topIds.has("SIBAU-BECSE"), "BE Computer Systems Engineering should be in the eligible top five.");
    },
  },
  {
    name: "E. Pre-Medical computing profile remains eligible for CS, SE, AI and Mathematics without Mathematics",
    run: () => {
      const result = generateRecommendations(testProfiles.E);
      const eligibleIds = new Set(ids(result.eligibleRecommendations));
      for (const expected of [
        "SIBAU-BSCS",
        "SIBAU-BSSE",
        "SIBAU-BSAI",
        "SIBAU-BSMATH",
      ] as const) {
        assert(eligibleIds.has(expected), `${expected} must remain eligible.`);
      }
      const topIds = new Set(ids(result.topFiveEligibleRecommendations));
      assert(
        ["SIBAU-BSCS", "SIBAU-BSSE", "SIBAU-BSAI"].filter((id) =>
          topIds.has(id as ProgramId),
        ).length >= 2,
        "At least two core computing programs should rank in the eligible top five.",
      );
    },
  },
  {
    name: "F. Broad profile reports low confidence and does not claim an Excellent Match",
    run: () => {
      const result = generateRecommendations(testProfiles.F);
      const top = result.topFiveEligibleRecommendations[0];
      assert(top, "Expected at least one eligible recommendation.");
      assert(top.confidence === "Low", `Expected Low confidence, received ${top.confidence}.`);
      assert(top.recommendationBand !== "Excellent Match", "The top result must not be overstated as Excellent.");
    },
  },
  {
    name: "Edge. Missing preferred subjects are omitted and available academic weights are re-normalized",
    run: () => {
      const result = calculateAcademicScore(
        { Mathematics: 80, English: 20 },
        marks({ English: 60 }),
      );
      assert(result.score === 60, `Expected re-normalized score 60, received ${result.score}.`);
      assert(result.missingSubjects.includes("Mathematics"), "Mathematics should be reported as omitted, not zero.");
    },
  },
  {
    name: "Edge. No weighted academic subject returns a neutral low-confidence result",
    run: () => {
      const result = calculateAcademicScore(
        { Mathematics: 100 },
        marks({ Biology: 80 }),
      );
      assert(result.score === 50, "No evidence should use the documented neutral placeholder.");
      assert(result.lowConfidence && result.evidenceCoverage === 0, "No evidence must be low-confidence with zero coverage.");
    },
  },
  {
    name: "Edge. Equal final scores use deterministic program-name ordering",
    run: () => {
      const allSeventy = profile(
        "Tie Profile",
        "ICS",
        Object.fromEntries(
          [
            "Mathematics",
            "Physics",
            "Computer Science",
            "English",
            "Biology",
            "Chemistry",
            "Accounting",
            "Economics",
            "General/Other",
          ].map((subject) => [subject, 70]),
        ) as Record<Subject, number>,
        Array(interestDimensions.length).fill(70),
        Array(aptitudeDimensions.length).fill(70),
      );
      const tiedPrograms = programs.filter(({ id }) =>
        ["SIBAU-BSCS", "SIBAU-BSSE", "SIBAU-BSAI"].includes(id),
      );
      const result = generateRecommendations(allSeventy, tiedPrograms);
      assert(
        result.eligibleRecommendations.every(({ finalScore }) => finalScore === 70),
        "The synthetic inputs should produce equal final scores.",
      );
      const names = result.eligibleRecommendations.map(({ programName }) => programName);
      const sortedNames = [...names].sort((left, right) => left.localeCompare(right));
      assert(JSON.stringify(names) === JSON.stringify(sortedNames), "Ties must be ordered by program name.");
    },
  },
  {
    name: "Edge. Out-of-range interest input is ignored safely",
    run: () => {
      const scores: InterestScores = { "Coding Interest": 101 };
      const result = calculateInterestScore({ "Coding Interest": 100 }, scores);
      assert(result.score === 50, "Invalid-only interest evidence should use the neutral placeholder.");
      assert(result.invalidDimensions.includes("Coding Interest"), "Invalid interest input should be reported.");
    },
  },
  {
    name: "Edge. Out-of-range aptitude input is ignored safely",
    run: () => {
      const scores: AptitudeScores = { "Logical Aptitude": -1 };
      const result = calculateAptitudeScore({ "Logical Aptitude": 100 }, scores);
      assert(result.score === 50, "Invalid-only aptitude evidence should use the neutral placeholder.");
      assert(result.invalidDimensions.includes("Logical Aptitude"), "Invalid aptitude input should be reported.");
    },
  },
  {
    name: "Edge. Not-eligible programs remain visible but never receive eligible ranks",
    run: () => {
      const result = generateRecommendations(testProfiles.E);
      const rankedIds = new Set(ids(result.eligibleRecommendations));
      for (const engineeringId of ["SIBAU-BEEE", "SIBAU-BECSE"] as const) {
        const item = result.notEligible.find(({ programId }) => programId === engineeringId);
        assert(item?.rank === null, `${engineeringId} must remain visible with rank null.`);
        assert(!rankedIds.has(engineeringId), `${engineeringId} must be excluded from eligible ranks.`);
      }
    },
  },
];

let passed = 0;
for (const test of tests) {
  try {
    test.run();
    passed += 1;
    console.log(`PASS ${test.name}`);
  } catch (error) {
    console.error(`FAIL ${test.name}`);
    throw error;
  }
}

console.log(`Recommendation engine tests passed: ${passed}/${tests.length}.`);
