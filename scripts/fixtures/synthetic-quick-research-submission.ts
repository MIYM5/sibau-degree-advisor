import { randomUUID } from "node:crypto";

import { briefAptitudeTasks } from "../../src/data/brief-aptitude-tasks";
import { quickInterestScenarios } from "../../src/data/quick-interest-scenarios";
import { buildVersion2RecommendationInput } from "../../src/lib/assessment-to-student-profile";
import { createConsentRecord } from "../../src/lib/consent-session";
import { generateVersion2Recommendations } from "../../src/lib/recommendation-engine";
import type { AssessmentMode } from "../../src/types/assessment-mode";
import type { DetailedRiasecResponse } from "../../src/types/detailed-interest";
import type { QuickInterestResponse } from "../../src/types/quick-interest";
import {
  RESEARCH_ASSESSMENT_VERSION,
  RESEARCH_PROGRAM_DATA_VERSION,
  RESEARCH_SUBMISSION_SCHEMA_VERSION,
  type DetailedResearchSubmission,
  type QuickResearchSubmission,
  type ResearchSubmission,
} from "../../src/types/research-submission";

/**
 * Synthetic adult-only fixture data for local development. It contains no real
 * participant identity, contact details, or imported participant responses.
 * Values are generated through the same question banks and scoring pipeline as
 * the application; the temporary scorer name is never included in the payload.
 */

export interface SyntheticResearchFixtureOptions {
  submissionId?: string;
  participantAnonymousId?: string;
  completedAt?: Date;
}

const subjectMarks = [
  {
    subject: "Mathematics" as const,
    obtainedMarks: 80,
    totalMarks: 100,
    calculatedPercentage: 80,
  },
  {
    subject: "Physics" as const,
    obtainedMarks: 75,
    totalMarks: 100,
    calculatedPercentage: 75,
  },
  {
    subject: "Computer Science" as const,
    obtainedMarks: 85,
    totalMarks: 100,
    calculatedPercentage: 85,
  },
];

const briefAptitudeResponses = briefAptitudeTasks.map((task) => ({
  taskId: task.id,
  selectedChoiceId: task.choices[0].id,
}));

const quickInterestResponses = quickInterestScenarios.map((scenario) => ({
  scenarioId: scenario.id,
  mostPreferredChoiceId: scenario.choices[0].id,
  secondPreferredChoiceId: scenario.choices[1].id,
  leastPreferredChoiceId: scenario.choices[5].id,
}));

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createSyntheticConsent(
  mode: AssessmentMode,
  participantAnonymousId: string,
  consentTimestamp: string,
) {
  const result = createConsentRecord({
    assessmentMode: mode,
    ageGroup: "age_18_or_above",
    operationalConsent: true,
    researchConsent: true,
    followUpContactConsent: false,
    analyticsConsent: false,
    participantSessionId: participantAnonymousId,
    consentTimestamp,
  });
  invariant(result.isValid && result.consent, "Synthetic consent is invalid.");
  return result.consent;
}

export function createSyntheticResearchSubmission(
  mode: "quick",
  interestResponses: readonly QuickInterestResponse[],
  options?: SyntheticResearchFixtureOptions,
): QuickResearchSubmission;
export function createSyntheticResearchSubmission(
  mode: "detailed",
  interestResponses: readonly DetailedRiasecResponse[],
  options?: SyntheticResearchFixtureOptions,
): DetailedResearchSubmission;
export function createSyntheticResearchSubmission(
  mode: AssessmentMode,
  interestResponses:
    | readonly QuickInterestResponse[]
    | readonly DetailedRiasecResponse[],
  options: SyntheticResearchFixtureOptions = {},
): ResearchSubmission {
  const participantAnonymousId =
    options.participantAnonymousId ?? randomUUID();
  const submissionId = options.submissionId ?? randomUUID();
  const completedAt = options.completedAt ?? new Date();
  const startedAt = new Date(completedAt.getTime() - 10 * 60 * 1000);
  const consentedAt = new Date(startedAt.getTime() - 60 * 1000);

  const built =
    mode === "quick"
      ? buildVersion2RecommendationInput({
          assessmentMode: "quick",
          name: "Synthetic local fixture",
          intermediateGroup: "ICS",
          subjectMarks,
          quickInterestResponses:
            interestResponses as readonly QuickInterestResponse[],
          briefAptitudeResponses,
        })
      : buildVersion2RecommendationInput({
          assessmentMode: "detailed",
          name: "Synthetic local fixture",
          intermediateGroup: "ICS",
          subjectMarks,
          detailedInterestResponses:
            interestResponses as readonly DetailedRiasecResponse[],
          briefAptitudeResponses,
        });

  invariant(built.isValid, `Could not build the synthetic ${mode} fixture.`);
  invariant(
    built.input.riasecResult.profile,
    `Synthetic ${mode} fixture has no RIASEC profile.`,
  );

  const generated = generateVersion2Recommendations(built.input);
  const institutionalFitWarning =
    generated.institutionalFitWarnings.length > 0;
  const recommendationResults = generated.recommendations.map((result) => ({
    programId: result.programId,
    eligibilityStatus: result.eligibilityStatus,
    academicScore: result.academicScore,
    interestScore: result.interestScore,
    aptitudeScore: result.aptitudeScore,
    finalScore: result.finalScore,
    rank: result.rank,
    recommendationBand: result.recommendationBand,
    confidence: result.confidence,
    institutionalFitWarning,
  }));

  const common = {
    schemaVersion: RESEARCH_SUBMISSION_SCHEMA_VERSION,
    submissionId,
    participantAnonymousId,
    consent: createSyntheticConsent(
      mode,
      participantAnonymousId,
      consentedAt.toISOString(),
    ),
    ageGroup: "age_18_or_above" as const,
    intermediateGroup: "ICS" as const,
    subjectMarks: subjectMarks.map((mark) => ({ ...mark })),
    overallPercentage: 80,
    riasecResult: {
      scores: { ...built.input.riasecResult.scores },
      topThreeCode: built.input.riasecResult.profile.hollandCode,
      evidenceLabel: built.input.riasecEvidenceLabel,
    },
    briefAptitudeResponses: briefAptitudeResponses.map((response) => ({
      ...response,
    })),
    aptitudeResult: {
      correctCount: built.input.briefAptitudeResult.totalCorrect,
      totalTasks: built.input.briefAptitudeResult.totalTasks,
      overallPercentage: built.input.briefAptitudeResult.overallPercentage,
      evidenceLabel: "Limited" as const,
    },
    recommendationResults,
    assessmentVersion: RESEARCH_ASSESSMENT_VERSION,
    programDataVersion: RESEARCH_PROGRAM_DATA_VERSION,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    completionSeconds: 600,
    minorProcedureEvidence: null,
    optionalFeedback: null,
  };

  if (mode === "quick") {
    return {
      ...common,
      assessmentMode: "quick",
      interestResponses: (
        interestResponses as readonly QuickInterestResponse[]
      ).map((response) => ({ ...response })),
      scoringModelVersion: "version-2-quick-55-30-15",
      questionnaireVersion: "version-2-quick-riasec-v1-brief-aptitude-v1",
    };
  }

  return {
    ...common,
    assessmentMode: "detailed",
    interestResponses: (
      interestResponses as readonly DetailedRiasecResponse[]
    ).map((response) => ({ ...response })),
    scoringModelVersion: "version-2-detailed-50-35-15",
    questionnaireVersion:
      "version-2-detailed-riasec-v1-brief-aptitude-v1",
  };
}

export function createSyntheticQuickResearchSubmission(
  options?: SyntheticResearchFixtureOptions,
): QuickResearchSubmission {
  return createSyntheticResearchSubmission(
    "quick",
    quickInterestResponses,
    options,
  );
}
