import { readdirSync, readFileSync, statSync } from "node:fs";
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
import {
  RESEARCH_RPC_FUNCTION_NAME,
  RESEARCH_RPC_PARAMETER_NAME,
  createResearchApiDiagnosticReporter,
  isSafeLocalResearchDiagnosticsEnabled,
  parseResearchRpcResult,
} from "../src/lib/research-api-diagnostics";
import type { AssessmentMode } from "../src/types/assessment-mode";
import type { ConsentRecord } from "../src/types/consent";
import type { ResearchGovernanceValidationResult } from "../src/types/research-governance";
import {
  RESEARCH_ASSESSMENT_VERSION,
  RESEARCH_PROGRAM_DATA_VERSION,
  RESEARCH_SUBMISSION_SCHEMA_VERSION,
  type ResearchSubmission,
} from "../src/types/research-submission";
import { createSyntheticDetailedResearchSubmission } from "./fixtures/synthetic-detailed-research-submission";
import { createSyntheticQuickResearchSubmission } from "./fixtures/synthetic-quick-research-submission";
import {
  LocalResearchTestResources,
  LocalResearchTestSafetyError,
  LocalResearchTestTimeoutError,
  assertLocalSyntheticResearchTestSafety,
  formatLocalApiFailure,
} from "./test-local-research-api";

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

function localSafetyRejects(
  environment: Record<string, string | undefined>,
  expectedCode: string,
): void {
  try {
    assertLocalSyntheticResearchTestSafety(environment);
  } catch (error) {
    assert(
      error instanceof LocalResearchTestSafetyError &&
        error.code === expectedCode,
      `Expected local safety refusal ${expectedCode}.`,
    );
    return;
  }
  throw new Error(`Local safety guard accepted ${expectedCode}.`);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

const quick = buildSubmission("quick");
const detailed = buildSubmission("detailed");
const syntheticQuick = createSyntheticQuickResearchSubmission();
const syntheticDetailed = createSyntheticDetailedResearchSubmission();
const safeLocalEnvironment = {
  LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED: "true",
  LOCAL_RESEARCH_TEST_APP_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-local-test-placeholder",
};

const tests: readonly { name: string; run: () => void | Promise<void> }[] = [
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
  {
    name: "synthetic Quick fixture passes the authoritative validator",
    run: () => assert(validateResearchSubmission(syntheticQuick, adultGovernance).isValid, "Synthetic Quick fixture was rejected."),
  },
  {
    name: "synthetic Detailed fixture passes the authoritative validator",
    run: () => assert(validateResearchSubmission(syntheticDetailed, adultGovernance).isValid, "Synthetic Detailed fixture was rejected."),
  },
  {
    name: "synthetic fixtures are adult-only and cover all generated evidence",
    run: () => {
      assert(syntheticQuick.ageGroup === "age_18_or_above" && syntheticDetailed.ageGroup === "age_18_or_above", "Synthetic fixture is not adult-only.");
      assert(syntheticQuick.interestResponses.length === quickInterestScenarios.length, "Quick fixture coverage is incomplete.");
      assert(syntheticDetailed.interestResponses.length === detailedRiasecQuestions.length, "Detailed fixture coverage is incomplete.");
      assert(syntheticQuick.briefAptitudeResponses.length === briefAptitudeTasks.length, "Quick aptitude coverage is incomplete.");
      assert(syntheticDetailed.briefAptitudeResponses.length === briefAptitudeTasks.length, "Detailed aptitude coverage is incomplete.");
      assert(syntheticQuick.recommendationResults.length === programs.length && syntheticDetailed.recommendationResults.length === programs.length, "Synthetic recommendation coverage is incomplete.");
    },
  },
  {
    name: "synthetic fixtures contain no name or contact fields",
    run: () => {
      const serialized = JSON.stringify([syntheticQuick, syntheticDetailed]).toLowerCase();
      for (const field of ["name", "email", "phone", "cnic", "address", "contact"]) {
        assert(!serialized.includes(`\"${field}\"`), `Synthetic fixture contains disallowed field: ${field}.`);
      }
    },
  },
  {
    name: "synthetic fixture identifiers are generated at runtime",
    run: () => {
      const another = createSyntheticQuickResearchSubmission();
      assert(another.submissionId !== syntheticQuick.submissionId, "Submission ID was reused.");
      assert(another.participantAnonymousId !== syntheticQuick.participantAnonymousId, "Participant ID was reused.");
    },
  },
  {
    name: "local synthetic test accepts an explicitly enabled local-only configuration",
    run: () => {
      const result = assertLocalSyntheticResearchTestSafety(safeLocalEnvironment);
      assert(result.applicationUrl.hostname === "127.0.0.1" && result.supabaseUrl.hostname === "localhost", "Safe local configuration changed.");
    },
  },
  {
    name: "local synthetic test refuses a disabled flag",
    run: () => localSafetyRejects({ ...safeLocalEnvironment, LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED: "false" }, "explicit_local_flag_required"),
  },
  {
    name: "local synthetic test refuses production mode",
    run: () => localSafetyRejects({ ...safeLocalEnvironment, NODE_ENV: "production" }, "production_environment_forbidden"),
  },
  {
    name: "local synthetic test refuses a hosted application URL",
    run: () => localSafetyRejects({ ...safeLocalEnvironment, LOCAL_RESEARCH_TEST_APP_URL: "https://example.org" }, "local_application_url_required"),
  },
  {
    name: "local synthetic test refuses a hosted Supabase URL",
    run: () => localSafetyRejects({ ...safeLocalEnvironment, NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" }, "local_supabase_url_required"),
  },
  {
    name: "API diagnostics require every safe local condition",
    run: () => {
      assert(isSafeLocalResearchDiagnosticsEnabled(safeLocalEnvironment), "Safe local diagnostics did not enable.");
      assert(!isSafeLocalResearchDiagnosticsEnabled({ ...safeLocalEnvironment, NODE_ENV: "production" }), "Production diagnostics enabled.");
      assert(!isSafeLocalResearchDiagnosticsEnabled({ ...safeLocalEnvironment, LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED: "false" }), "Disabled diagnostics flag was accepted.");
      assert(!isSafeLocalResearchDiagnosticsEnabled({ ...safeLocalEnvironment, LOCAL_RESEARCH_TEST_APP_URL: "https://example.org" }), "Remote application diagnostics enabled.");
      assert(!isSafeLocalResearchDiagnosticsEnabled({ ...safeLocalEnvironment, NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" }), "Remote Supabase diagnostics enabled.");
    },
  },
  {
    name: "production API error bodies remain generic",
    run: () => {
      const events: unknown[] = [];
      const reporter = createResearchApiDiagnosticReporter(
        { ...safeLocalEnvironment, NODE_ENV: "production" },
        (event) => events.push(event),
      );
      const body = reporter.attach(
        {
          success: false,
          code: "research_submission_failed",
          message: "The submission could not be stored.",
        },
        {
          stage: "rpc_response_receipt",
          code: "rpc_database_error",
          httpStatus: 500,
          rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
          supabaseCode: "42501",
        },
      );
      reporter.log({ stage: "rpc_response_receipt", code: "rpc_database_error" });
      assert(!("diagnostic" in body), "Production error disclosed diagnostics.");
      assert(events.length === 0, "Production diagnostics were logged.");
    },
  },
  {
    name: "local diagnostic logging strips sensitive and unknown fields",
    run: () => {
      const events: unknown[] = [];
      const reporter = createResearchApiDiagnosticReporter(
        safeLocalEnvironment,
        (event) => events.push(event),
      );
      reporter.log({
        stage: "rpc_response_receipt",
        code: "rpc_database_error",
        httpStatus: 500,
        rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
        supabaseCode: "42501",
        payload: "SENSITIVE_MARKS_AND_RESPONSES",
        details: "SENSITIVE_DATABASE_DETAILS",
      } as never);
      const serialized = JSON.stringify(events);
      assert(events.length === 1, "Safe local diagnostic was not logged.");
      assert(!serialized.includes("SENSITIVE"), "Sensitive diagnostic content was retained.");
      assert(Object.keys(events[0] as object).every((key) => ["stage", "code", "httpStatus", "rpcFunction", "supabaseCode"].includes(key)), "Unexpected diagnostic field was retained.");
    },
  },
  {
    name: "RPC result parser handles the actual Supabase array and snake-case fields",
    run: () => {
      const parsed = parseResearchRpcResult([
        {
          public_research_code: "SDA-SYNTHETIC",
          assessment_id: "c26baa32-bf64-4f10-bd2f-3f86409e147a",
        },
      ]);
      assert(parsed?.publicResearchCode === "SDA-SYNTHETIC", "RPC public code was not parsed.");
      assert(parsed.assessmentId === "c26baa32-bf64-4f10-bd2f-3f86409e147a", "RPC assessment ID was not parsed.");
      assert(parseResearchRpcResult([{ publicResearchCode: "wrong", assessmentId: "wrong" }]) === null, "Camel-case RPC fields were incorrectly accepted.");
    },
  },
  {
    name: "local API failures expose only safe stage and code diagnostics",
    run: () => {
      const message = formatLocalApiFailure("Quick POST", 500, {
        success: false,
        code: "research_submission_failed",
        diagnostic: {
          stage: "rpc_response_receipt",
          code: "rpc_database_error",
          supabaseCode: "42501",
          payload: "SENSITIVE_PAYLOAD",
        },
      });
      assert(message.includes("HTTP 500"), "Local failure omitted HTTP status.");
      assert(message.includes("API stage=rpc_response_receipt"), "Local failure omitted diagnostic stage.");
      assert(message.includes("diagnostic code=rpc_database_error"), "Local failure omitted diagnostic code.");
      assert(!message.includes("SENSITIVE"), "Local failure printed payload data.");
    },
  },
  {
    name: "RPC source contract matches the applied migration contract",
    run: () => {
      const route = readFileSync(resolve(process.cwd(), "src/app/api/research-submissions/route.ts"), "utf8");
      const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/001_research_schema.sql"), "utf8");
      assert(RESEARCH_RPC_FUNCTION_NAME === "submit_research_assessment", "RPC function constant changed.");
      assert(RESEARCH_RPC_PARAMETER_NAME === "p_submission", "RPC parameter constant changed.");
      assert(route.includes('rpc("submit_research_assessment", {'), "Route RPC function name changed.");
      assert(route.includes("p_submission: databasePayload"), "Route RPC parameter name changed.");
      assert(!/\.(?:single|maybeSingle)\(/.test(route), "Route incorrectly applies single-row modifiers to RPC.");
      assert(migration.includes("grant execute on function public.submit_research_assessment(jsonb) to service_role"), "Service role RPC grant is missing.");
      assert(migration.includes("returns table(public_research_code text, assessment_id uuid)"), "RPC return fields changed.");
    },
  },
  {
    name: "local harness timeout aborts an unresolved operation and clears its timer",
    run: async () => {
      const resources = new LocalResearchTestResources();
      let signalWasAborted = false;
      try {
        await resources.runWithTimeout(
          "synthetic database timeout test",
          10,
          (signal) =>
            new Promise<never>((_, reject) => {
              signal.addEventListener(
                "abort",
                () => {
                  signalWasAborted = true;
                  reject(signal.reason);
                },
                { once: true },
              );
            }),
        );
        throw new Error("Unresolved operation did not time out.");
      } catch (error) {
        assert(error instanceof LocalResearchTestTimeoutError, "Timeout returned the wrong error type.");
        assert(error.stage === "synthetic database timeout test", "Timeout lost its stage name.");
      } finally {
        await resources.cleanup();
      }
      assert(signalWasAborted, "Timed-out operation did not receive an abort signal.");
      assert(resources.activeOperationCount === 0, "Timed-out operation retained an active controller.");
    },
  },
  {
    name: "local harness cleanup aborts active work and runs cleanup exactly once",
    run: async () => {
      const resources = new LocalResearchTestResources();
      let cleanupCount = 0;
      resources.registerCleanup(() => {
        cleanupCount += 1;
      });
      const pending = resources
        .runWithTimeout(
          "synthetic cleanup test",
          1_000,
          (signal) =>
            new Promise<never>((_, reject) => {
              signal.addEventListener(
                "abort",
                () => reject(new Error("Synthetic operation aborted.")),
                { once: true },
              );
            }),
        )
        .catch((error: unknown) => error);

      await Promise.resolve();
      await resources.cleanup();
      const result = await pending;
      await resources.cleanup();

      assert(result instanceof Error, "Cleanup did not abort the active operation.");
      assert(cleanupCount === 1, "Cleanup action did not run exactly once.");
      assert(resources.activeOperationCount === 0, "Cleanup retained an active controller.");
    },
  },
  {
    name: "local harness uses the POST API and does not call the database function directly",
    run: () => {
      const harness = readFileSync(resolve(process.cwd(), "scripts/test-local-research-api.ts"), "utf8");
      assert(harness.includes('new URL("/api/research-submissions"'), "Local harness does not use the application API.");
      assert(!harness.includes(".rpc("), "Local harness calls an RPC directly.");
      assert(!/method:\s*["']GET["']/.test(harness), "Local harness performs a GET request.");
    },
  },
  {
    name: "local harness does not weaken API governance or connect the UI",
    run: () => {
      const route = readFileSync(resolve(process.cwd(), "src/app/api/research-submissions/route.ts"), "utf8");
      assert(route.includes("getResearchGovernanceStatus()"), "API governance check is missing.");
      assert(!route.includes("LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED"), "Local test flag bypasses API governance.");
      const componentSources = sourceFiles(resolve(process.cwd(), "src/components"))
        .filter((path) => /\.(ts|tsx)$/.test(path))
        .map((path) => readFileSync(path, "utf8"))
        .join("\n");
      assert(!componentSources.includes("/api/research-submissions"), "A UI component calls the research API.");
    },
  },
];

async function runTests(): Promise<void> {
  for (const test of tests) {
    await test.run();
    console.log(`PASS: ${test.name}`);
  }

  console.log(`\n${tests.length} research-submission validation tests passed.`);
}

runTests().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown test failure.";
  console.error(message);
  process.exitCode = 1;
});
