import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

import { briefAptitudeTasks } from "../src/data/brief-aptitude-tasks";
import { detailedRiasecQuestions } from "../src/data/detailed-riasec-questions";
import { programs } from "../src/data/programs";
import { quickInterestScenarios } from "../src/data/quick-interest-scenarios";
import { buildVersion2RecommendationInput } from "../src/lib/assessment-to-student-profile";
import { createConsentRecord } from "../src/lib/consent-session";
import { generateVersion2Recommendations } from "../src/lib/recommendation-engine";
import {
  MAX_RESEARCH_SUBMISSION_BYTES,
  parseResearchSubmissionJson,
  validateResearchDatabaseConfig,
  validateResearchSubmission,
} from "../src/lib/research-record-validation";
import { validateResearchGovernanceConfig } from "../src/lib/research-governance";
import type { AssessmentMode } from "../src/types/assessment-mode";
import type { ConsentRecord } from "../src/types/consent";
import type { ResearchGovernanceValidationResult } from "../src/types/research-governance";
import {
  RESEARCH_ASSESSMENT_VERSION,
  RESEARCH_PROGRAM_DATA_VERSION,
  RESEARCH_SUBMISSION_SCHEMA_VERSION,
  type ResearchSubmission,
} from "../src/types/research-submission";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const participantId = "c26baa32-bf64-4f10-bd2f-3f86409e147a";
const submissionId = "7f9c2ba4-3eb2-4e18-b20d-26aa9469f0e2";
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
const briefResponses = briefAptitudeTasks.map((task) => ({
  taskId: task.id,
  selectedChoiceId: task.choices[0].id,
}));
const quickResponses = quickInterestScenarios.map((scenario) => ({
  scenarioId: scenario.id,
  mostPreferredChoiceId: scenario.choices[0].id,
  secondPreferredChoiceId: scenario.choices[1].id,
  leastPreferredChoiceId: scenario.choices[5].id,
}));
const detailedResponses = detailedRiasecQuestions.map((question) => ({
  questionId: question.id,
  value: 4 as const,
}));

const adultEnvironment = {
  RESEARCH_DATA_COLLECTION_ENABLED: "true",
  RESEARCH_ETHICS_APPROVAL_REFERENCE: "ETHICS-2026-001",
  RESEARCH_ETHICS_COMMITTEE_NAME: "Example Ethics Committee",
  RESEARCH_RESPONSIBLE_RESEARCHER: "Example Researcher",
  RESEARCH_CONTACT_EMAIL: "research@example.org",
  PRIVACY_CONTACT_EMAIL: "privacy@example.org",
  RESEARCH_RETENTION_YEARS: "3",
  RESEARCH_WITHDRAWAL_URL: "https://example.org/withdraw",
  MINOR_RESEARCH_PROCESS_APPROVED: "false",
} as const;
const adultGovernance = validateResearchGovernanceConfig(adultEnvironment);
const guidanceGovernance = validateResearchGovernanceConfig({});
const minorGovernance = validateResearchGovernanceConfig({
  ...adultEnvironment,
  MINOR_RESEARCH_PROCESS_APPROVED: "true",
  RESEARCH_GUARDIAN_CONSENT_PROCEDURE_REFERENCE: "GUARDIAN-001",
  RESEARCH_MINOR_ASSENT_PROCEDURE_REFERENCE: "ASSENT-001",
});

function consent(
  mode: AssessmentMode,
  ageGroup: ConsentRecord["ageGroup"] = "age_18_or_above",
  researchConsent = true,
): ConsentRecord {
  const result = createConsentRecord({
    assessmentMode: mode,
    ageGroup,
    operationalConsent: true,
    researchConsent,
    followUpContactConsent: false,
    analyticsConsent: false,
    participantSessionId: participantId,
    consentTimestamp: "2026-07-18T10:00:00.000Z",
  });
  assert(result.isValid && result.consent, "Test consent could not be created.");
  return result.consent;
}

function buildSubmission(mode: "quick" | "detailed"): ResearchSubmission {
  const built =
    mode === "quick"
      ? buildVersion2RecommendationInput({
          assessmentMode: "quick",
          name: "Research participant",
          intermediateGroup: "ICS",
          subjectMarks,
          quickInterestResponses: quickResponses,
          briefAptitudeResponses: briefResponses,
        })
      : buildVersion2RecommendationInput({
          assessmentMode: "detailed",
          name: "Research participant",
          intermediateGroup: "ICS",
          subjectMarks,
          detailedInterestResponses: detailedResponses,
          briefAptitudeResponses: briefResponses,
        });
  assert(built.isValid, `Could not build ${mode} test input.`);
  const generated = generateVersion2Recommendations(built.input);
  const hasWarning = generated.institutionalFitWarnings.length > 0;
  const recommendationResults = generated.recommendations.map((item) => ({
    programId: item.programId,
    eligibilityStatus: item.eligibilityStatus,
    academicScore: item.academicScore,
    interestScore: item.interestScore,
    aptitudeScore: item.aptitudeScore,
    finalScore: item.finalScore,
    rank: item.rank,
    recommendationBand: item.recommendationBand,
    confidence: item.confidence,
    institutionalFitWarning: hasWarning,
  }));
  const common = {
    schemaVersion: RESEARCH_SUBMISSION_SCHEMA_VERSION,
    submissionId,
    participantAnonymousId: participantId,
    consent: consent(mode),
    ageGroup: "age_18_or_above" as const,
    intermediateGroup: "ICS" as const,
    subjectMarks: subjectMarks.map((mark) => ({ ...mark })),
    overallPercentage: 80,
    riasecResult: {
      scores: { ...built.input.riasecResult.scores },
      topThreeCode: built.input.riasecResult.profile!.hollandCode,
      evidenceLabel: built.input.riasecEvidenceLabel,
    },
    briefAptitudeResponses: briefResponses.map((response) => ({ ...response })),
    aptitudeResult: {
      correctCount: built.input.briefAptitudeResult.totalCorrect,
      totalTasks: built.input.briefAptitudeResult.totalTasks,
      overallPercentage: built.input.briefAptitudeResult.overallPercentage,
      evidenceLabel: "Limited" as const,
    },
    recommendationResults,
    assessmentVersion: RESEARCH_ASSESSMENT_VERSION,
    programDataVersion: RESEARCH_PROGRAM_DATA_VERSION,
    startedAt: "2026-07-18T10:01:00.000Z",
    completedAt: "2026-07-18T10:11:00.000Z",
    completionSeconds: 600,
    minorProcedureEvidence: null,
    optionalFeedback: null,
  };
  return mode === "quick"
    ? {
        ...common,
        assessmentMode: "quick",
        interestResponses: quickResponses.map((response) => ({ ...response })),
        scoringModelVersion: "version-2-quick-55-30-15",
        questionnaireVersion:
          "version-2-quick-riasec-v1-brief-aptitude-v1",
      }
    : {
        ...common,
        assessmentMode: "detailed",
        interestResponses: detailedResponses.map((response) => ({ ...response })),
        scoringModelVersion: "version-2-detailed-50-35-15",
        questionnaireVersion:
          "version-2-detailed-riasec-v1-brief-aptitude-v1",
      };
}

function clone(value: ResearchSubmission): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function invalid(
  value: unknown,
  code: string,
  governance: ResearchGovernanceValidationResult = adultGovernance,
): void {
  const result = validateResearchSubmission(value, governance);
  assert(!result.isValid, `${code}: invalid submission was accepted.`);
  assert(result.issues.some((issue) => issue.code === code), `${code}: expected issue was not returned.`);
}

const quick = buildSubmission("quick");
const detailed = buildSubmission("detailed");

const tests: readonly { name: string; run: () => void }[] = [
  {
    name: "valid adult Quick submission is accepted",
    run: () => assert(validateResearchSubmission(quick, adultGovernance).isValid, "Valid Quick submission was rejected."),
  },
  {
    name: "valid adult Detailed submission is accepted",
    run: () => assert(validateResearchSubmission(detailed, adultGovernance).isValid, "Valid Detailed submission was rejected."),
  },
  {
    name: "malformed JSON is rejected",
    run: () => assert(parseResearchSubmissionJson("{", adultGovernance).issues[0]?.code === "malformed_json", "Malformed JSON was accepted."),
  },
  {
    name: "unsupported schema version is rejected",
    run: () => invalid({ ...clone(quick), schemaVersion: 2 }, "unsupported_schema_version"),
  },
  {
    name: "invalid submission UUID is rejected",
    run: () => invalid({ ...clone(quick), submissionId: "bad-id" }, "invalid_submission_id"),
  },
  {
    name: "operational consent false is rejected",
    run: () => {
      const value = clone(quick);
      value.consent = { ...(value.consent as Record<string, unknown>), operationalConsent: false };
      invalid(value, "operational_consent_required");
    },
  },
  {
    name: "research consent false is rejected",
    run: () => {
      const value = clone(quick);
      value.consent = {
        ...consent("quick", "age_18_or_above", false),
      };
      invalid(value, "research_consent_required");
    },
  },
  {
    name: "guidance-only governance rejects storage",
    run: () => invalid(quick, "participant_not_storage_eligible", guidanceGovernance),
  },
  {
    name: "adult-ready governance accepts an eligible adult",
    run: () => assert(validateResearchSubmission(quick, adultGovernance).isValid, "Eligible adult was rejected."),
  },
  {
    name: "minor is rejected under adult-only governance",
    run: () => {
      const value = clone(quick);
      value.ageGroup = "age_16_17";
      value.consent = consent("quick", "age_16_17");
      invalid(value, "minor_governance_not_ready", adultGovernance);
    },
  },
  {
    name: "minor is rejected without participant-specific evidence",
    run: () => {
      const value = clone(quick);
      value.ageGroup = "age_16_17";
      value.consent = consent("quick", "age_16_17");
      invalid(value, "minor_procedure_evidence_required", minorGovernance);
    },
  },
  {
    name: "minor-ready configuration alone cannot authorize a minor write",
    run: () => {
      const value = clone(quick);
      value.ageGroup = "age_16_17";
      value.consent = consent("quick", "age_16_17");
      value.minorProcedureEvidence = {
        guardianConsentCompleted: true,
        minorAssentCompleted: true,
        procedureVersion: "minor-procedure-v1",
        recordedAt: "2026-07-18T10:00:30.000Z",
      };
      invalid(value, "participant_not_storage_eligible", minorGovernance);
    },
  },
  {
    name: "invalid assessment mode is rejected",
    run: () => invalid({ ...clone(quick), assessmentMode: "standard" }, "invalid_assessment_mode"),
  },
  {
    name: "Quick mode with Detailed scoring version is rejected",
    run: () => invalid({ ...clone(quick), scoringModelVersion: "version-2-detailed-50-35-15" }, "mode_scoring_version_mismatch"),
  },
  {
    name: "Detailed mode with Quick scoring version is rejected",
    run: () => invalid({ ...clone(detailed), scoringModelVersion: "version-2-quick-55-30-15" }, "mode_scoring_version_mismatch"),
  },
  {
    name: "invalid subject marks are rejected",
    run: () => {
      const value = clone(quick);
      value.subjectMarks = [{ ...subjectMarks[0], obtainedMarks: 101 }];
      invalid(value, "invalid_subject_marks");
    },
  },
  {
    name: "duplicate subjects are rejected",
    run: () => {
      const value = clone(quick);
      value.subjectMarks = [subjectMarks[0], subjectMarks[0]];
      invalid(value, "duplicate_subject");
    },
  },
  {
    name: "missing RIASEC dimension is rejected",
    run: () => {
      const value = clone(quick);
      const riasec = value.riasecResult as Record<string, unknown>;
      const scores = { ...(riasec.scores as Record<string, unknown>) };
      delete scores.realistic;
      value.riasecResult = { ...riasec, scores };
      invalid(value, "missing_riasec_dimension");
    },
  },
  {
    name: "invalid RIASEC score is rejected",
    run: () => {
      const value = clone(quick);
      const riasec = value.riasecResult as Record<string, unknown>;
      value.riasecResult = { ...riasec, scores: { ...(riasec.scores as object), realistic: 101 } };
      invalid(value, "invalid_riasec_score");
    },
  },
  {
    name: "duplicate interest response is rejected",
    run: () => {
      const value = clone(quick);
      const responses = value.interestResponses as unknown[];
      value.interestResponses = [...responses, responses[0]];
      invalid(value, "duplicate_interest_response");
    },
  },
  {
    name: "duplicate aptitude response is rejected",
    run: () => {
      const value = clone(quick);
      const responses = value.briefAptitudeResponses as unknown[];
      value.briefAptitudeResponses = [...responses, responses[0]];
      invalid(value, "duplicate_aptitude_response");
    },
  },
  {
    name: "invalid aptitude percentage is rejected",
    run: () => {
      const value = clone(quick);
      value.aptitudeResult = { ...(value.aptitudeResult as object), overallPercentage: 101 };
      invalid(value, "invalid_aptitude_result");
    },
  },
  {
    name: "unknown recommendation program is rejected",
    run: () => {
      const value = clone(quick);
      const results = value.recommendationResults as Record<string, unknown>[];
      results[0] = { ...results[0], programId: "UNKNOWN" };
      invalid(value, "unknown_program_id");
    },
  },
  {
    name: "duplicate recommendation program is rejected",
    run: () => {
      const value = clone(quick);
      const results = value.recommendationResults as Record<string, unknown>[];
      results[1] = { ...results[1], programId: results[0].programId };
      invalid(value, "duplicate_recommendation_program");
    },
  },
  {
    name: "fewer than 14 recommendations are rejected",
    run: () => {
      const value = clone(quick);
      value.recommendationResults = (value.recommendationResults as unknown[]).slice(0, 13);
      invalid(value, "invalid_recommendation_count");
    },
  },
  {
    name: "eligible result without rank is rejected",
    run: () => {
      const value = clone(quick);
      const results = value.recommendationResults as Record<string, unknown>[];
      const index = results.findIndex((item) => item.eligibilityStatus === "Eligible");
      results[index] = { ...results[index], rank: null };
      invalid(value, "eligible_result_missing_rank");
    },
  },
  {
    name: "ineligible result with rank is rejected",
    run: () => {
      const value = clone(quick);
      const results = value.recommendationResults as Record<string, unknown>[];
      const index = results.findIndex((item) => item.eligibilityStatus !== "Eligible");
      results[index] = { ...results[index], rank: 1 };
      invalid(value, "unranked_result_has_rank");
    },
  },
  {
    name: "invalid feedback is rejected",
    run: () => {
      const value = clone(quick);
      value.optionalFeedback = { interestAlignmentRating: 6 };
      invalid(value, "invalid_optional_feedback");
    },
  },
  {
    name: "unexpected top-level field is rejected",
    run: () => invalid({ ...clone(quick), studentName: "Not allowed" }, "unexpected_field"),
  },
  {
    name: "oversized payload is rejected",
    run: () => {
      const serialized = " ".repeat(MAX_RESEARCH_SUBMISSION_BYTES + 1);
      assert(parseResearchSubmissionJson(serialized, adultGovernance).issues[0]?.code === "payload_too_large", "Oversized payload was accepted.");
    },
  },
  {
    name: "duplicate submission ID is handled safely",
    run: () => {
      const result = validateResearchSubmission(quick, adultGovernance, {
        existingSubmissionIds: new Set([submissionId]),
      });
      assert(!result.isValid && result.issues.some(({ code }) => code === "duplicate_submission_id"), "Duplicate submission was accepted.");
    },
  },
  {
    name: "payload contains no student name",
    run: () => assert(!Object.keys(quick).includes("name") && !Object.keys(quick).includes("studentName"), "Student name field exists."),
  },
  {
    name: "payload contains no contact or direct identifier fields",
    run: () => {
      const serialized = JSON.stringify(quick).toLowerCase();
      for (const field of ["email", "phone", "cnic", "address", "geolocation", "fingerprint", "ipaddress"]) {
        assert(!serialized.includes(`\"${field}\"`), `Disallowed field exists: ${field}.`);
      }
    },
  },
  {
    name: "governance remains disabled by default",
    run: () => assert(guidanceGovernance.status === "guidance_only", "Default governance enabled collection."),
  },
  {
    name: "missing Supabase credentials are handled safely",
    run: () => assert(!validateResearchDatabaseConfig({}).isConfigured, "Missing database credentials were accepted."),
  },
  {
    name: "API exposes no GET route",
    run: () => {
      const route = readFileSync(resolve(process.cwd(), "src/app/api/research-submissions/route.ts"), "utf8");
      assert(!/export\s+(async\s+)?function\s+GET\b/.test(route), "API exports a GET handler.");
    },
  },
  {
    name: "server client is marked server-only and service-role stays out of public names",
    run: () => {
      const server = readFileSync(resolve(process.cwd(), "src/lib/supabase/server.ts"), "utf8");
      assert(server.includes('import "server-only"'), "Server-only boundary is missing.");
      assert(!server.includes("NEXT_PUBLIC_SUPABASE_SERVICE"), "Service role was made public.");
    },
  },
  {
    name: "migration enables RLS on all 11 research tables and creates no public policy",
    run: () => {
      const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/001_research_schema.sql"), "utf8");
      const rlsCount = migration.match(/enable row level security/gi)?.length ?? 0;
      assert(rlsCount === 11, `Expected 11 RLS statements, received ${rlsCount}.`);
      assert(!/create\s+policy/i.test(migration), "A public policy was introduced.");
      assert(migration.includes("security definer"), "Transactional function is not security definer.");
    },
  },
  {
    name: "API contains no sensitive request logging",
    run: () => {
      const route = readFileSync(resolve(process.cwd(), "src/app/api/research-submissions/route.ts"), "utf8");
      assert(!/console\.|logger\.|JSON\.stringify\(.*submission/i.test(route), "Route contains request logging.");
    },
  },
  {
    name: "all 14 known program IDs are represented",
    run: () => assert(new Set(quick.recommendationResults.map(({ programId }) => programId)).size === programs.length, "Program coverage changed."),
  },
  {
    name: "protected workbook checksum remains unchanged",
    run: () => {
      const workbook = readFileSync(resolve(process.cwd(), "data/SIBAU_Degree_Recommendation_Knowledge_Base_PreMedical_Updated.xlsx"));
      const hash = createHash("sha256").update(workbook).digest("hex").toUpperCase();
      assert(hash === "AC40B83DAC8727B39933E031B1ED070DCAA99FB088E6F2DED51A2EB45D9CB80A", "Protected workbook changed.");
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`\n${tests.length} research-submission validation tests passed.`);
