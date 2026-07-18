import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { aptitudeQuestions } from "../src/data/aptitude-questions";
import { briefAptitudeTasks } from "../src/data/brief-aptitude-tasks";
import { detailedRiasecQuestions } from "../src/data/detailed-riasec-questions";
import { interestQuestions } from "../src/data/interest-questions";
import { programRiasecWeights } from "../src/data/program-riasec-weights";
import { programs } from "../src/data/programs";
import { quickInterestScenarios } from "../src/data/quick-interest-scenarios";
import {
  createRecommendationSessionPayload,
  createVersion2RecommendationSessionPayload,
  parseRecommendationSessionPayload,
  type AssessmentSessionDraft,
} from "../src/lib/assessment-session";
import {
  buildStudentProfile,
  buildVersion2RecommendationInput,
} from "../src/lib/assessment-to-student-profile";
import { calculateBriefAptitudeAssessment } from "../src/lib/brief-aptitude-assessment";
import { calculateBriefAptitudeScore } from "../src/lib/brief-aptitude-scoring";
import {
  generateRecommendations,
  generateVersion2Recommendations,
  LIMITED_APTITUDE_CONFIDENCE_NOTE,
} from "../src/lib/recommendation-engine";
import { calculateRiasecInterestScore } from "../src/lib/riasec-interest-scoring";
import type { AptitudeResponses } from "../src/lib/aptitude-assessment";
import type { InterestResponses } from "../src/lib/interest-assessment";
import type { BriefAptitudeResponse } from "../src/types/brief-aptitude";
import type {
  DetailedRiasecResponse,
  DetailedRiasecResponseValue,
} from "../src/types/detailed-interest";
import type { Subject } from "../src/types/program";
import type { QuickInterestResponse } from "../src/types/quick-interest";
import {
  createRiasecProfile,
  riasecDimensionOrder,
  type RiasecDimension,
  type RiasecScores,
} from "../src/types/riasec";
import type {
  Version2DetailedRecommendationInput,
  Version2QuickRecommendationInput,
  Version2RecommendationInput,
} from "../src/types/recommendation";
import type { StudentProfile, SubjectMark } from "../src/types/student";

const WORKBOOK_SHA256 =
  "AC40B83DAC8727B39933E031B1ED070DCAA99FB088E6F2DED51A2EB45D9CB80A";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string): void {
  assert(
    Math.abs(actual - expected) < 0.000001,
    `${message} Expected ${expected}, received ${actual}.`,
  );
}

function expectThrow(action: () => unknown, message: string): void {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

function marks(percentages: Partial<Record<Subject, number>>): SubjectMark[] {
  return Object.entries(percentages).map(([subject, percentage]) => ({
    subject: subject as Subject,
    obtainedMarks: percentage,
    totalMarks: 100,
    calculatedPercentage: percentage,
  }));
}

const completeAcademicMarks = marks({
  Mathematics: 80,
  Physics: 80,
  "Computer Science": 80,
  English: 80,
  Biology: 80,
  Chemistry: 80,
  Accounting: 80,
  Economics: 80,
  "General/Other": 80,
});

function quickResponses(): QuickInterestResponse[] {
  return quickInterestScenarios.map((scenario, index) => ({
    scenarioId: scenario.id,
    mostPreferredChoiceId: scenario.choices[index % 6].id,
    secondPreferredChoiceId: scenario.choices[(index + 1) % 6].id,
    leastPreferredChoiceId: scenario.choices[(index + 5) % 6].id,
  }));
}

function detailedResponses(
  byDimension: Partial<Record<RiasecDimension, DetailedRiasecResponseValue>> = {},
): DetailedRiasecResponse[] {
  return detailedRiasecQuestions.map((question) => ({
    questionId: question.id,
    value: byDimension[question.dimension] ?? 4,
  }));
}

function briefResponses(correctCount: number): BriefAptitudeResponse[] {
  const correctChoiceIds = [
    "brief-numerical-C",
    "brief-logical-D",
    "brief-verbal-B",
    "brief-spatial-technical-B",
    "brief-data-interpretation-B",
  ] as const;
  return briefAptitudeTasks.map((task, index) => ({
    taskId: task.id,
    selectedChoiceId:
      index < correctCount ? correctChoiceIds[index] : task.choices[0].id,
  }));
}

function buildQuickInput(options?: {
  subjectMarks?: SubjectMark[];
  intermediateGroup?: "ICS" | "Pre-Medical";
  correctCount?: number;
}): Version2QuickRecommendationInput {
  const built = buildVersion2RecommendationInput({
    assessmentMode: "quick",
    name: "Quick Student",
    intermediateGroup: options?.intermediateGroup ?? "ICS",
    subjectMarks: options?.subjectMarks ?? completeAcademicMarks,
    quickInterestResponses: quickResponses(),
    briefAptitudeResponses: briefResponses(options?.correctCount ?? 4),
  });
  assert(built.isValid, built.errors.join(" "));
  assert(built.input.assessmentMode === "quick", "Expected Quick input.");
  return built.input;
}

function buildDetailedInput(options?: {
  subjectMarks?: SubjectMark[];
  intermediateGroup?: "ICS" | "Pre-Medical";
  correctCount?: number;
  dimensionValues?: Partial<
    Record<RiasecDimension, DetailedRiasecResponseValue>
  >;
}): Version2DetailedRecommendationInput {
  const built = buildVersion2RecommendationInput({
    assessmentMode: "detailed",
    name: "Detailed Student",
    intermediateGroup: options?.intermediateGroup ?? "ICS",
    subjectMarks: options?.subjectMarks ?? completeAcademicMarks,
    detailedInterestResponses: detailedResponses(options?.dimensionValues),
    briefAptitudeResponses: briefResponses(options?.correctCount ?? 4),
  });
  assert(built.isValid, built.errors.join(" "));
  assert(built.input.assessmentMode === "detailed", "Expected Detailed input.");
  return built.input;
}

function withScores<T extends Version2RecommendationInput>(
  input: T,
  scores: RiasecScores,
): T {
  const evidenceLabel = input.riasecEvidenceLabel;
  return {
    ...input,
    riasecResult: {
      ...input.riasecResult,
      scores: { ...scores },
      profile: createRiasecProfile(scores, evidenceLabel),
    },
  } as T;
}

const alignedScores: RiasecScores = {
  realistic: 80,
  investigative: 80,
  artistic: 80,
  social: 80,
  enterprising: 80,
  conventional: 80,
};

const zeroScores: RiasecScores = {
  realistic: 0,
  investigative: 0,
  artistic: 0,
  social: 0,
  enterprising: 0,
  conventional: 0,
};

function findResult(
  result: ReturnType<typeof generateVersion2Recommendations>,
  programId: string,
) {
  const item = result.recommendations.find(
    (recommendation) => recommendation.programId === programId,
  );
  assert(item, `Expected result for ${programId}.`);
  return item;
}

const bscs = programs.find(({ id }) => id === "SIBAU-BSCS")!;
const bscsMapping = programRiasecWeights.find(
  ({ programId }) => programId === "SIBAU-BSCS",
)!;

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "1. Quick mode uses the 55/30/15 formula",
    run: () => {
      const input = buildQuickInput();
      const item = findResult(generateVersion2Recommendations(input, [bscs]), bscs.id);
      close(
        item.finalScore,
        item.academicScore * 0.55 + item.interestScore * 0.3 + item.aptitudeScore * 0.15,
        "Quick formula mismatch.",
      );
    },
  },
  {
    name: "2. Detailed mode uses the 50/35/15 formula",
    run: () => {
      const input = buildDetailedInput();
      const item = findResult(generateVersion2Recommendations(input, [bscs]), bscs.id);
      close(
        item.finalScore,
        item.academicScore * 0.5 + item.interestScore * 0.35 + item.aptitudeScore * 0.15,
        "Detailed formula mismatch.",
      );
    },
  },
  {
    name: "3. The same component evidence produces mode-specific final scores",
    run: () => {
      const scores = { ...alignedScores, investigative: 60 };
      const quick = findResult(
        generateVersion2Recommendations(withScores(buildQuickInput(), scores), [bscs]),
        bscs.id,
      );
      const detailed = findResult(
        generateVersion2Recommendations(withScores(buildDetailedInput(), scores), [bscs]),
        bscs.id,
      );
      assert(quick.finalScore !== detailed.finalScore, "Mode formulas should differ when academic and interest scores differ.");
    },
  },
  {
    name: "4. Quick confidence never becomes High",
    run: () => {
      const result = generateVersion2Recommendations(
        withScores(buildQuickInput({ correctCount: 4 }), alignedScores),
      );
      assert(result.recommendations.every(({ confidence }) => confidence !== "High"), "Quick confidence must never be High.");
    },
  },
  {
    name: "5. Detailed complete aligned evidence can produce High confidence",
    run: () => {
      const result = generateVersion2Recommendations(
        withScores(buildDetailedInput({ correctCount: 4 }), alignedScores),
      );
      assert(result.recommendations.some(({ confidence }) => confidence === "High"), "Expected at least one High-confidence Detailed result.");
    },
  },
  {
    name: "6. Detailed High confidence retains the exact limited-aptitude warning",
    run: () => {
      const result = generateVersion2Recommendations(
        withScores(buildDetailedInput({ correctCount: 4 }), alignedScores),
      );
      const high = result.recommendations.find(({ confidence }) => confidence === "High");
      assert(high, "Expected a High-confidence Detailed result.");
      assert(high.reasons.includes(LIMITED_APTITUDE_CONFIDENCE_NOTE), "High confidence must include the exact limited-aptitude warning.");
      assert(high.confidenceNotes?.includes(LIMITED_APTITUDE_CONFIDENCE_NOTE), "High confidence metadata must retain the warning.");
    },
  },
  {
    name: "7. Brief aptitude can change the final score by no more than 15 points",
    run: () => {
      const low = findResult(generateVersion2Recommendations(withScores(buildQuickInput({ correctCount: 0 }), alignedScores), [bscs]), bscs.id);
      const high = findResult(generateVersion2Recommendations(withScores(buildQuickInput({ correctCount: 5 }), alignedScores), [bscs]), bscs.id);
      close(high.finalScore - low.finalScore, 15, "Brief aptitude maximum contribution mismatch.");
    },
  },
  {
    name: "8. RIASEC score matches a manual weighted calculation",
    run: () => {
      const scores: RiasecScores = { realistic: 10, investigative: 20, artistic: 30, social: 40, enterprising: 50, conventional: 60 };
      const result = calculateRiasecInterestScore(scores, bscsMapping);
      const expected = 10 * 0.2 + 20 * 0.45 + 30 * 0.05 + 40 * 0.05 + 50 * 0.1 + 60 * 0.15;
      close(result.score, expected, "Manual RIASEC calculation mismatch.");
    },
  },
  {
    name: "9. All six RIASEC dimensions return contribution details",
    run: () => {
      const result = calculateRiasecInterestScore(alignedScores, bscsMapping);
      assert(result.contributions.length === 6, "Expected six contribution records.");
      for (const dimension of riasecDimensionOrder) {
        assert(result.contributions.some((item) => item.dimension === dimension), `${dimension} contribution is missing.`);
      }
    },
  },
  {
    name: "10. Unknown RIASEC dimensions are rejected",
    run: () => {
      expectThrow(() => calculateRiasecInterestScore({ ...alignedScores, unknown: 50 }, bscsMapping), "Unknown dimensions must be rejected.");
    },
  },
  {
    name: "11. Missing RIASEC dimensions are rejected",
    run: () => {
      const missing: Partial<RiasecScores> = { ...alignedScores };
      delete missing.conventional;
      expectThrow(() => calculateRiasecInterestScore(missing, bscsMapping), "Missing dimensions must be rejected.");
    },
  },
  {
    name: "12. Missing Version 2 RIASEC evidence is rejected before generation",
    run: () => {
      const malformed = { ...buildQuickInput(), riasecResult: undefined };
      expectThrow(() => generateVersion2Recommendations(malformed), "Missing RIASEC evidence must fail.");
    },
  },
  {
    name: "13. Missing Version 2 brief aptitude evidence is rejected",
    run: () => {
      const malformed = { ...buildQuickInput(), briefAptitudeResult: undefined };
      expectThrow(() => generateVersion2Recommendations(malformed), "Missing aptitude evidence must fail.");
    },
  },
  {
    name: "14. Quick mode rejects the Detailed scoring version",
    run: () => {
      const malformed = { ...buildQuickInput(), scoringModelVersion: "version-2-detailed-50-35-15" };
      expectThrow(() => generateVersion2Recommendations(malformed), "Quick/scoring mismatch must fail.");
    },
  },
  {
    name: "15. Detailed mode rejects the Quick scoring version",
    run: () => {
      const malformed = { ...buildDetailedInput(), scoringModelVersion: "version-2-quick-55-30-15" };
      expectThrow(() => generateVersion2Recommendations(malformed), "Detailed/scoring mismatch must fail.");
    },
  },
  {
    name: "16. Eligible ranks are consecutive and deterministic",
    run: () => {
      const first = generateVersion2Recommendations(buildDetailedInput());
      const second = generateVersion2Recommendations(buildDetailedInput());
      assert(first.eligibleRecommendations.every((item, index) => item.rank === index + 1), "Eligible ranks must be consecutive.");
      assert(JSON.stringify(first.eligibleRecommendations.map(({ programId }) => programId)) === JSON.stringify(second.eligibleRecommendations.map(({ programId }) => programId)), "Ranks must be deterministic.");
    },
  },
  {
    name: "17. Verification-required programs remain unranked",
    run: () => {
      const result = generateVersion2Recommendations(buildDetailedInput());
      assert(result.verificationRequired.length > 0 && result.verificationRequired.every(({ rank }) => rank === null), "Verification-required results must be unranked.");
    },
  },
  {
    name: "18. Not-eligible programs remain unranked",
    run: () => {
      const result = generateVersion2Recommendations(buildDetailedInput());
      assert(result.notEligible.length > 0 && result.notEligible.every(({ rank }) => rank === null), "Not-eligible results must be unranked.");
    },
  },
  {
    name: "19. All 14 programs remain visible and classified",
    run: () => {
      const result = generateVersion2Recommendations(buildQuickInput());
      assert(result.recommendations.length === 14, `Expected 14 programs, received ${result.recommendations.length}.`);
      assert(result.eligibleRecommendations.length + result.verificationRequired.length + result.notEligible.length === 14, "Every program must appear in one classification.");
    },
  },
  {
    name: "20. Pre-Medical without Mathematics stays eligible for CS, SE, AI, and Mathematics",
    run: () => {
      const input = buildDetailedInput({
        intermediateGroup: "Pre-Medical",
        subjectMarks: marks({ Biology: 85, Chemistry: 80, Physics: 80, English: 75 }),
      });
      const eligible = new Set(generateVersion2Recommendations(input).eligibleRecommendations.map(({ programId }) => programId));
      for (const id of ["SIBAU-BSCS", "SIBAU-BSSE", "SIBAU-BSAI", "SIBAU-BSMATH"] as const) {
        assert(eligible.has(id), `${id} must remain eligible.`);
      }
    },
  },
  {
    name: "21. Pre-Medical remains ineligible for both restricted engineering programs",
    run: () => {
      const input = buildQuickInput({
        intermediateGroup: "Pre-Medical",
        subjectMarks: marks({ Biology: 85, Chemistry: 80, Physics: 80, English: 75 }),
      });
      const notEligible = new Set(generateVersion2Recommendations(input).notEligible.map(({ programId }) => programId));
      assert(notEligible.has("SIBAU-BEEE") && notEligible.has("SIBAU-BECSE"), "Both engineering programs must remain Not eligible.");
    },
  },
  {
    name: "22. Health-oriented RIASEC profile receives the clinical-fit warning",
    run: () => {
      const input = withScores(buildDetailedInput({ intermediateGroup: "Pre-Medical", subjectMarks: marks({ Biology: 90, Chemistry: 80, Physics: 80, English: 75 }) }), { realistic: 40, investigative: 90, artistic: 30, social: 90, enterprising: 20, conventional: 30 });
      const result = generateVersion2Recommendations(input);
      assert(result.institutionalFitWarnings.some(({ code }) => code === "field_not_offered_clinical_health"), "Expected health/clinical-fit warning.");
    },
  },
  {
    name: "23. Weak top recommendation receives the weak-match warning",
    run: () => {
      const input = withScores(buildQuickInput({ intermediateGroup: "Pre-Medical", subjectMarks: marks({ Biology: 50, Chemistry: 50, Physics: 50, English: 50 }), correctCount: 0 }), zeroScores);
      const result = generateVersion2Recommendations(input);
      assert(result.institutionalFitWarnings.some(({ code }) => code === "top_match_is_weak"), "Expected weak-top warning.");
    },
  },
  {
    name: "24. Insufficient academic evidence receives an evidence warning",
    run: () => {
      const input = buildQuickInput({ intermediateGroup: "Pre-Medical", subjectMarks: marks({ Biology: 80 }), correctCount: 3 });
      const result = generateVersion2Recommendations(input, [bscs]);
      assert(result.institutionalFitWarnings.some(({ code }) => code === "insufficient_recommendation_evidence"), "Expected insufficient-evidence warning.");
    },
  },
  {
    name: "25. Version 1 formula and result shape remain unchanged",
    run: () => {
      const all70 = Object.fromEntries(interestQuestions.map(({ dimension }) => [dimension, 70]));
      const aptitude70 = Object.fromEntries(aptitudeQuestions.map(({ dimension }) => [dimension, 70]));
      const profile: StudentProfile = { name: "Legacy", intermediateGroup: "ICS", subjectMarks: completeAcademicMarks.map((mark) => ({ ...mark, obtainedMarks: 70, calculatedPercentage: 70 })), interestScores: all70, aptitudeScores: aptitude70 };
      const item = findResult(generateRecommendations(profile) as ReturnType<typeof generateVersion2Recommendations>, bscs.id);
      close(item.finalScore, item.academicScore * 0.5 + item.interestScore * 0.3 + item.aptitudeScore * 0.2, "Version 1 formula changed.");
      assert(item.confidenceNotes === undefined, "Version 1 result shape must not gain Version 2 confidence metadata.");
    },
  },
  {
    name: "26. Valid Version 1 payloads remain readable",
    run: () => {
      const interestResponses = Object.fromEntries(interestQuestions.map(({ id }) => [id, 3])) as InterestResponses;
      const aptitudeResponses = Object.fromEntries(aptitudeQuestions.map(({ id }) => [id, 3])) as AptitudeResponses;
      const built = buildStudentProfile({ name: "Legacy", intermediateGroup: "ICS", subjectMarks: completeAcademicMarks, interestResponses, aptitudeResponses });
      assert(built.isValid, built.errors.join(" "));
      const draft: AssessmentSessionDraft = { name: "Legacy", intermediateGroup: "ICS", subjectRows: completeAcademicMarks.map((mark) => ({ ...mark, isOptional: false })), interestResponses, aptitudeResponses };
      const payload = createRecommendationSessionPayload(draft, built.profile, generateRecommendations(built.profile));
      assert(parseRecommendationSessionPayload(JSON.stringify(payload))?.version === 1, "Version 1 payload should parse.");
    },
  },
  {
    name: "27. Version 2 session round-trip preserves mode, versions, RIASEC, and aptitude evidence",
    run: () => {
      const input = buildQuickInput();
      const draft: AssessmentSessionDraft = { schemaVersion: 2, name: input.academicProfile.name, intermediateGroup: input.academicProfile.intermediateGroup, subjectRows: input.academicProfile.subjectMarks.map((mark) => ({ ...mark, isOptional: false })), interestResponses: {}, aptitudeResponses: {}, quickInterestResponses: input.riasecResult.responses, briefAptitudeResponses: input.briefAptitudeResult.responses };
      const result = generateVersion2Recommendations(input);
      const payload = createVersion2RecommendationSessionPayload(draft, input, result);
      const parsed = parseRecommendationSessionPayload(JSON.stringify(payload));
      assert(parsed?.version === 2, "Version 2 payload should parse.");
      assert(parsed.recommendationInput.assessmentMode === "quick", "Mode was not preserved.");
      assert(parsed.recommendationInput.scoringModelVersion === input.scoringModelVersion, "Scoring version was not preserved.");
      assert(JSON.stringify(parsed.recommendationInput.riasecResult.scores) === JSON.stringify(input.riasecResult.scores), "RIASEC scores were not preserved.");
      assert(parsed.recommendationInput.briefAptitudeResult.overallPercentage === input.briefAptitudeResult.overallPercentage, "Brief aptitude result was not preserved.");
    },
  },
  {
    name: "28. Malformed Version 2 session metadata is rejected",
    run: () => {
      const input = buildQuickInput();
      const draft: AssessmentSessionDraft = { schemaVersion: 2, name: input.academicProfile.name, intermediateGroup: input.academicProfile.intermediateGroup, subjectRows: input.academicProfile.subjectMarks.map((mark) => ({ ...mark, isOptional: false })), interestResponses: {}, aptitudeResponses: {}, quickInterestResponses: input.riasecResult.responses, briefAptitudeResponses: input.briefAptitudeResult.responses };
      const payload = createVersion2RecommendationSessionPayload(draft, input, generateVersion2Recommendations(input));
      const malformed = { ...payload, recommendationInput: { ...payload.recommendationInput, scoringModelVersion: "version-2-detailed-50-35-15" } };
      assert(parseRecommendationSessionPayload(JSON.stringify(malformed)) === null, "Mismatched session metadata must be rejected.");
    },
  },
  {
    name: "29. Scoring does not mutate program or RIASEC weights",
    run: () => {
      const beforePrograms = JSON.stringify(programs);
      const beforeMappings = JSON.stringify(programRiasecWeights);
      generateVersion2Recommendations(buildDetailedInput());
      assert(JSON.stringify(programs) === beforePrograms, "Program data was mutated.");
      assert(JSON.stringify(programRiasecWeights) === beforeMappings, "RIASEC mappings were mutated.");
    },
  },
  {
    name: "30. Protected workbook checksum remains unchanged",
    run: () => {
      const workbookPath = resolve(process.cwd(), "data", "SIBAU_Degree_Recommendation_Knowledge_Base_PreMedical_Updated.xlsx");
      const checksum = createHash("sha256").update(readFileSync(workbookPath)).digest("hex").toUpperCase();
      assert(checksum === WORKBOOK_SHA256, `Workbook checksum changed: ${checksum}.`);
    },
  },
  {
    name: "31. Brief aptitude scorer rejects non-finite or out-of-range percentages",
    run: () => {
      const valid = calculateBriefAptitudeAssessment(briefResponses(4));
      expectThrow(() => calculateBriefAptitudeScore({ ...valid, overallPercentage: Number.NaN }), "Non-finite aptitude score must fail.");
      expectThrow(() => calculateBriefAptitudeScore({ ...valid, overallPercentage: 101 }), "Out-of-range aptitude score must fail.");
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

console.log(`Version 2 recommendation tests passed: ${passed}/${tests.length}.`);
