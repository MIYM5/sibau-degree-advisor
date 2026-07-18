import { calculateBriefAptitudeAssessment } from "../src/lib/brief-aptitude-assessment";
import {
  buildProfileMethodologyPresentation,
  buildRecommendationPresentation,
  createRiasecExplanation,
  getMeaningfulDifferenceLabel,
  SCORE_DIFFERENCE_GUIDANCE,
} from "../src/lib/recommendation-presentation";
import type {
  InstitutionalFitWarning,
  RecommendationEngineResult,
  Version2RecommendationEngineResult,
} from "../src/lib/recommendation-engine";
import type { RecommendationSessionPayload } from "../src/lib/assessment-session";
import type { ProgramId } from "../src/types/program";
import type {
  EligibleRecommendationResult,
  RecommendationConfidence,
  UnrankedRecommendationResult,
  Version2RecommendationInput,
} from "../src/types/recommendation";
import {
  createRiasecProfile,
  type RiasecScores,
} from "../src/types/riasec";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const programIds: readonly ProgramId[] = [
  "SIBAU-BBA",
  "SIBAU-BBA-AGRI",
  "SIBAU-BSCS",
  "SIBAU-BSSE",
  "SIBAU-BSAI",
  "SIBAU-BSAF",
  "SIBAU-BSECO",
];

function eligible(
  rank: number,
  finalScore: number,
  confidence: RecommendationConfidence = "Medium",
): EligibleRecommendationResult {
  const programId = programIds[rank - 1] ?? "SIBAU-BEDH";
  return {
    programId,
    programName: `Eligible Program ${rank}`,
    eligibilityStatus: "Eligible",
    academicScore: finalScore,
    interestScore: finalScore,
    aptitudeScore: finalScore,
    finalScore,
    recommendationBand: finalScore >= 75 ? "Strong Match" : "Good Match",
    confidence,
    evidenceCoverage: 1,
    rank,
    reasons: ["Presentation test reason."],
    improvementAreas: [],
  };
}

function unranked(
  status: "Verification required" | "Not eligible",
  programId: ProgramId,
): UnrankedRecommendationResult {
  return {
    programId,
    programName: `${status} Program`,
    eligibilityStatus: status,
    academicScore: 70,
    interestScore: 65,
    aptitudeScore: 60,
    finalScore: 66,
    recommendationBand: "Good Match",
    confidence: "Low",
    evidenceCoverage: 1,
    rank: null,
    reasons: ["Stored eligibility reason."],
    improvementAreas: [],
  };
}

function engineResult(
  scores: readonly number[],
  options?: {
    verification?: UnrankedRecommendationResult[];
    notEligible?: UnrankedRecommendationResult[];
    warnings?: InstitutionalFitWarning[];
  },
): RecommendationEngineResult {
  const eligibleRecommendations = scores.map((score, index) =>
    eligible(index + 1, score),
  );
  const verificationRequired = options?.verification ?? [];
  const notEligible = options?.notEligible ?? [];
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
    institutionalFitWarnings: options?.warnings ?? [],
  };
}

const riasecScores: RiasecScores = {
  realistic: 85,
  investigative: 90,
  artistic: 70,
  social: 60,
  enterprising: 50,
  conventional: 40,
};

const correctBriefResponses = [
  { taskId: "brief-numerical", selectedChoiceId: "brief-numerical-C" },
  { taskId: "brief-logical", selectedChoiceId: "brief-logical-D" },
  { taskId: "brief-verbal", selectedChoiceId: "brief-verbal-B" },
  {
    taskId: "brief-spatial-technical",
    selectedChoiceId: "brief-spatial-technical-B",
  },
  {
    taskId: "brief-data-interpretation",
    selectedChoiceId: "brief-data-interpretation-B",
  },
] as const;

function version2Payload(
  mode: "quick" | "detailed",
): RecommendationSessionPayload {
  const riasecProfile = createRiasecProfile(
    riasecScores,
    mode === "quick" ? "Preliminary" : "Stronger interest evidence",
  );
  const briefAptitudeResult = calculateBriefAptitudeAssessment(
    correctBriefResponses,
  );
  assert(briefAptitudeResult.isValid, "Brief fixture should be valid.");
  const baseInput = {
    version: 2 as const,
    academicProfile: {
      name: "Presentation Student",
      intermediateGroup: "ICS" as const,
      subjectMarks: [
        {
          subject: "Mathematics" as const,
          obtainedMarks: 80,
          totalMarks: 100,
          calculatedPercentage: 80,
        },
      ],
    },
    briefAptitudeResult,
    aptitudeEvidenceLabel: "Limited" as const,
  };
  const recommendationInput: Version2RecommendationInput =
    mode === "quick"
      ? {
          ...baseInput,
          assessmentMode: "quick",
          scoringModelVersion: "version-2-quick-55-30-15",
          questionnaireVersion:
            "version-2-quick-riasec-v1-brief-aptitude-v1",
          riasecEvidenceLabel: "Preliminary",
          riasecResult: {
            responses: [],
            rawScores: riasecScores,
            scores: riasecScores,
            profile: riasecProfile,
            evidenceLabel: "Preliminary",
            completedScenarioCount: 5,
            totalScenarioCount: 5,
            evidenceCoverage: 1,
            errors: [],
            isComplete: true,
            isValid: true,
          },
        }
      : {
          ...baseInput,
          assessmentMode: "detailed",
          scoringModelVersion: "version-2-detailed-50-35-15",
          questionnaireVersion:
            "version-2-detailed-riasec-v1-brief-aptitude-v1",
          riasecEvidenceLabel: "Stronger interest evidence",
          riasecResult: {
            responses: [],
            scores: riasecScores,
            profile: riasecProfile,
            profileExplanation: "Detailed profile explanation.",
            evidenceLabel: "Stronger interest evidence",
            evidenceCoverage: {
              answeredQuestions: 30,
              totalQuestions: 30,
              percentageCoverage: 100,
              perDimension: {} as never,
            },
            missingQuestionIds: [],
            errors: [],
            isComplete: true,
            isValid: true,
          },
        };
  const baseResult = engineResult([82, 80, 78, 75, 72]);
  const recommendationResult: Version2RecommendationEngineResult = {
    ...baseResult,
    version: 2,
    assessmentMode: mode,
    scoringModelVersion: recommendationInput.scoringModelVersion,
    questionnaireVersion: recommendationInput.questionnaireVersion,
    riasecEvidenceLabel: recommendationInput.riasecEvidenceLabel,
    aptitudeEvidenceLabel: "Limited",
    componentWeights:
      mode === "quick"
        ? { academic: 0.55, interest: 0.3, aptitude: 0.15 }
        : { academic: 0.5, interest: 0.35, aptitude: 0.15 },
  };

  return {
    version: 2,
    createdAt: "2026-07-18T00:00:00.000Z",
    assessmentDraft: {
      schemaVersion: 2,
      name: recommendationInput.academicProfile.name,
      intermediateGroup: recommendationInput.academicProfile.intermediateGroup,
      subjectRows: recommendationInput.academicProfile.subjectMarks.map(
        (mark) => ({ ...mark, isOptional: false }),
      ),
      interestResponses: {},
      aptitudeResponses: {},
      briefAptitudeResponses: briefAptitudeResult.responses,
    },
    recommendationInput,
    recommendationResult,
  };
}

function version1Payload(): RecommendationSessionPayload {
  const result = engineResult([80, 78]);
  return {
    version: 1,
    createdAt: "2026-07-18T00:00:00.000Z",
    assessmentDraft: {
      name: "Legacy Student",
      intermediateGroup: "ICS",
      subjectRows: [],
      interestResponses: {},
      aptitudeResponses: {},
    },
    studentProfile: {
      name: "Legacy Student",
      intermediateGroup: "ICS",
      subjectMarks: [],
      interestScores: {},
      aptitudeScores: {},
    },
    recommendationResult: result,
  };
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "1. Ranks 1-3 appear in Top Matches",
    run: () => {
      const result = buildRecommendationPresentation(
        engineResult([90, 87, 84, 80, 76]),
      );
      assert(
        result?.topMatches.map(({ recommendation }) => recommendation.rank).join(",") ===
          "1,2,3",
        "Top Matches should contain ranks 1-3.",
      );
    },
  },
  {
    name: "2. Ranks 4-5 appear in Alternative Options",
    run: () => {
      const result = buildRecommendationPresentation(
        engineResult([90, 87, 84, 80, 76]),
      );
      assert(
        result?.alternativeOptions
          .map(({ recommendation }) => recommendation.rank)
          .join(",") === "4,5",
        "Alternative Options should contain ranks 4-5.",
      );
    },
  },
  {
    name: "3. Fewer than five eligible programs create no placeholders",
    run: () => {
      const result = buildRecommendationPresentation(engineResult([90, 85]));
      assert(result?.topMatches.length === 2, "Both available matches should show.");
      assert(result.alternativeOptions.length === 0, "No placeholder alternative should be created.");
    },
  },
  {
    name: "4. No eligible programs are handled safely",
    run: () => {
      const result = buildRecommendationPresentation(engineResult([]));
      assert(result !== null, "Empty eligible input should remain valid.");
      assert(result.topMatches.length === 0 && result.alternativeOptions.length === 0, "Eligible groups should be empty.");
    },
  },
  {
    name: "5. Verification-required programs remain unranked and separate",
    run: () => {
      const verification = unranked("Verification required", "SIBAU-BSAF");
      const result = buildRecommendationPresentation(engineResult([90], { verification: [verification] }));
      assert(result?.verificationRequired[0]?.rank === null, "Verification result must have no rank.");
      assert(!result.topMatches.some(({ recommendation }) => recommendation.programId === verification.programId), "Verification result entered Top Matches.");
    },
  },
  {
    name: "6. Not-eligible programs remain unranked and separate",
    run: () => {
      const notEligible = unranked("Not eligible", "SIBAU-BEEE");
      const result = buildRecommendationPresentation(engineResult([90], { notEligible: [notEligible] }));
      assert(result?.notEligible[0]?.rank === null, "Not-eligible result must have no rank.");
      assert(!result.topMatches.some(({ recommendation }) => recommendation.programId === notEligible.programId), "Not-eligible result entered Top Matches.");
    },
  },
  {
    name: "7. Difference below 3 is Approximately equal match",
    run: () => assert(getMeaningfulDifferenceLabel(2.999) === "Approximately equal match", "Below-three boundary failed."),
  },
  {
    name: "8. Difference exactly 3 is Moderately stronger match",
    run: () => assert(getMeaningfulDifferenceLabel(3) === "Moderately stronger match", "Three-point boundary failed."),
  },
  {
    name: "9. Difference below 7 is Moderately stronger match",
    run: () => assert(getMeaningfulDifferenceLabel(6.999) === "Moderately stronger match", "Below-seven boundary failed."),
  },
  {
    name: "10. Difference exactly 7 is Clearly stronger match",
    run: () => assert(getMeaningfulDifferenceLabel(7) === "Clearly stronger match", "Seven-point boundary failed."),
  },
  {
    name: "11. Tied scores are Approximately equal match",
    run: () => assert(getMeaningfulDifferenceLabel(0) === "Approximately equal match", "Tie handling failed."),
  },
  {
    name: "12. Rank 1 has no comparison label",
    run: () => {
      const result = buildRecommendationPresentation(engineResult([90, 88]));
      assert(result?.topMatches[0]?.comparisonWithPrevious === null, "Rank 1 should have no comparison.");
    },
  },
  {
    name: "13. Comparison uses the immediately preceding eligible program",
    run: () => {
      const result = buildRecommendationPresentation(engineResult([90, 84, 80]));
      const comparison = result?.topMatches[2]?.comparisonWithPrevious;
      assert(comparison?.difference === 4, "Rank 3 should compare with rank 2, not rank 1.");
      assert(comparison.label === "Moderately stronger match", "Immediate comparison label is wrong.");
    },
  },
  {
    name: "14. Existing deterministic ordering is preserved",
    run: () => {
      const source = engineResult([90, 88, 86, 84, 82]);
      const result = buildRecommendationPresentation(source);
      const displayed = [...(result?.topMatches ?? []), ...(result?.alternativeOptions ?? [])].map(({ recommendation }) => recommendation.programId);
      assert(JSON.stringify(displayed) === JSON.stringify(source.eligibleRecommendations.map(({ programId }) => programId)), "Presentation reordered eligible results.");
    },
  },
  {
    name: "15. Quick formula metadata displays 55/30/15",
    run: () => {
      const summary = buildProfileMethodologyPresentation(version2Payload("quick"));
      assert(summary?.assessmentLabel === "Quick Guidance", "Quick label missing.");
      assert(summary.componentWeights.academic === 0.55 && summary.componentWeights.interest === 0.3 && summary.componentWeights.aptitude === 0.15, "Quick formula metadata mismatch.");
    },
  },
  {
    name: "16. Detailed formula metadata displays 50/35/15",
    run: () => {
      const summary = buildProfileMethodologyPresentation(version2Payload("detailed"));
      assert(summary?.assessmentLabel === "Detailed Guidance", "Detailed label missing.");
      assert(summary.componentWeights.academic === 0.5 && summary.componentWeights.interest === 0.35 && summary.componentWeights.aptitude === 0.15, "Detailed formula metadata mismatch.");
    },
  },
  {
    name: "17. Quick confidence guidance never presents High",
    run: () => {
      const payload = version2Payload("quick");
      assert(payload.recommendationResult.eligibleRecommendations.every(({ confidence }) => confidence !== "High"), "Quick fixture displayed High confidence.");
      const summary = buildProfileMethodologyPresentation(payload);
      assert(summary?.confidenceGuidance.includes("never exceeds Medium"), "Quick confidence cap explanation missing.");
    },
  },
  {
    name: "18. Aptitude evidence remains Limited",
    run: () => {
      const summary = buildProfileMethodologyPresentation(version2Payload("detailed"));
      assert(summary?.aptitudeEvidenceLabel === "Limited" && summary.aptitude?.evidenceLabel === "Limited", "Aptitude evidence must remain Limited.");
    },
  },
  {
    name: "19. RIASEC code and top-three dimensions are presented correctly",
    run: () => {
      const summary = buildProfileMethodologyPresentation(version2Payload("quick"));
      assert(summary?.riasec?.hollandCode === "IRA", "Expected deterministic IRA code.");
      assert(summary.riasec.topThreeLabels.join(",") === "Investigative,Realistic,Artistic", "Top-three labels mismatch.");
      assert(createRiasecExplanation(summary.riasec.topThreeDimensions)?.includes("complex problem-solving"), "Required explanation theme is missing.");
    },
  },
  {
    name: "20. Institutional-fit warnings are preserved exactly",
    run: () => {
      const warning: InstitutionalFitWarning = { code: "field_not_offered_clinical_health", message: "Only included SIBAU programs are compared." };
      const result = buildRecommendationPresentation(engineResult([90], { warnings: [warning] }));
      assert(JSON.stringify(result?.institutionalFitWarnings) === JSON.stringify([warning]), "Warning content changed during presentation.");
    },
  },
  {
    name: "21. Version 1 results remain displayable",
    run: () => {
      const payload = version1Payload();
      const groups = buildRecommendationPresentation(payload.recommendationResult);
      const summary = buildProfileMethodologyPresentation(payload);
      assert(groups?.topMatches.length === 2, "Version 1 eligible results should display.");
      assert(summary?.assessmentLabel === "Version 1 assessment", "Version 1 methodology label is missing.");
      assert(summary.scoringModelVersion === "version-1-custom-50-30-20", "Version 1 scoring model is wrong.");
    },
  },
  {
    name: "22. Malformed presentation input is rejected safely",
    run: () => {
      assert(buildRecommendationPresentation(null) === null, "Null should be rejected.");
      assert(buildRecommendationPresentation({ eligibleRecommendations: [{ rank: 99 }] }) === null, "Malformed ranks should be rejected.");
      assert(getMeaningfulDifferenceLabel(Number.NaN) === null, "Non-finite difference should be rejected.");
    },
  },
  {
    name: "23. Statistical-proof caution uses the approved wording",
    run: () => {
      assert(SCORE_DIFFERENCE_GUIDANCE === "Small score differences should not be treated as proof that one program is definitively better than another.", "Score-difference guidance changed.");
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

console.log(`Recommendation presentation tests passed: ${passed}/${tests.length}.`);
