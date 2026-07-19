import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { programs } from "../src/data/programs";
import { getResearchGovernanceStatus } from "../src/lib/research-governance";
import { validateResearchSubmission } from "../src/lib/research-record-validation";
import type { ResearchSubmission } from "../src/types/research-submission";
import { createSyntheticDetailedResearchSubmission } from "./fixtures/synthetic-detailed-research-submission";
import { createSyntheticQuickResearchSubmission } from "./fixtures/synthetic-quick-research-submission";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

interface EnvironmentSource {
  [key: string]: string | undefined;
}

export interface LocalResearchTestConfiguration {
  applicationUrl: URL;
  supabaseUrl: URL;
  serviceRoleKey: string;
}

export class LocalResearchTestSafetyError extends Error {
  constructor(public readonly code: string) {
    super(`Local synthetic research test refused: ${code}.`);
    this.name = "LocalResearchTestSafetyError";
  }
}

function localUrl(value: string | undefined, code: string): URL {
  let url: URL;
  try {
    url = new URL(value ?? "");
  } catch {
    throw new LocalResearchTestSafetyError(code);
  }
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new LocalResearchTestSafetyError(code);
  }
  return url;
}

/** Fail closed before any network or database operation can start. */
export function assertLocalSyntheticResearchTestSafety(
  environment: EnvironmentSource,
): LocalResearchTestConfiguration {
  if (environment.LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED !== "true") {
    throw new LocalResearchTestSafetyError("explicit_local_flag_required");
  }
  if (environment.NODE_ENV === "production") {
    throw new LocalResearchTestSafetyError("production_environment_forbidden");
  }

  const applicationUrl = localUrl(
    environment.LOCAL_RESEARCH_TEST_APP_URL,
    "local_application_url_required",
  );
  const supabaseUrl = localUrl(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    "local_supabase_url_required",
  );
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new LocalResearchTestSafetyError("local_service_role_key_required");
  }

  return { applicationUrl, supabaseUrl, serviceRoleKey };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cloneSubmission<T extends ResearchSubmission>(submission: T): T {
  return JSON.parse(JSON.stringify(submission)) as T;
}

interface ApiResponseBody {
  success?: unknown;
  code?: unknown;
  publicResearchCode?: unknown;
  assessmentId?: unknown;
}

async function postSubmission(
  applicationUrl: URL,
  submission: ResearchSubmission,
): Promise<{ status: number; body: ApiResponseBody }> {
  const endpoint = new URL("/api/research-submissions", applicationUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(submission),
  });
  const body = (await response.json()) as ApiResponseBody;
  return { status: response.status, body };
}

async function rowCount(
  database: SupabaseClient,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  const result = await database
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  if (result.error || result.count === null) {
    throw new Error(`Local row-count verification failed for ${table}.`);
  }
  return result.count;
}

async function assessmentIdFor(
  database: SupabaseClient,
  submissionId: string,
): Promise<string> {
  const result = await database
    .from("assessments")
    .select("id")
    .eq("submission_id", submissionId)
    .single();
  if (result.error || typeof result.data?.id !== "string") {
    throw new Error("Local assessment lookup failed.");
  }
  return result.data.id;
}

async function verifySuccessfulWrite(
  database: SupabaseClient,
  submission: ResearchSubmission,
  assessmentId: string,
): Promise<void> {
  const expectedInterestRows = submission.assessmentMode === "quick" ? 5 : 30;
  const expected = [
    ["participants", "id", submission.participantAnonymousId, 1],
    ["consents", "submission_id", submission.submissionId, 1],
    ["assessments", "submission_id", submission.submissionId, 1],
    ["subject_marks", "assessment_id", assessmentId, submission.subjectMarks.length],
    ["interest_responses", "assessment_id", assessmentId, expectedInterestRows],
    ["riasec_scores", "assessment_id", assessmentId, 1],
    ["aptitude_responses", "assessment_id", assessmentId, 5],
    ["aptitude_results", "assessment_id", assessmentId, 1],
    ["recommendation_results", "assessment_id", assessmentId, programs.length],
    ["assessment_feedback", "assessment_id", assessmentId, 0],
    ["participant_contacts", "participant_id", submission.participantAnonymousId, 0],
  ] as const;

  for (const [table, column, value, expectedCount] of expected) {
    const actualCount = await rowCount(database, table, column, value);
    assert(
      actualCount === expectedCount,
      `Unexpected local row count for ${table}: expected ${expectedCount}, received ${actualCount}.`,
    );
  }
}

async function verifyNoWrite(
  database: SupabaseClient,
  submission: ResearchSubmission,
): Promise<void> {
  const checks = [
    ["participants", "id", submission.participantAnonymousId],
    ["consents", "submission_id", submission.submissionId],
    ["assessments", "submission_id", submission.submissionId],
  ] as const;
  for (const [table, column, value] of checks) {
    assert(
      (await rowCount(database, table, column, value)) === 0,
      `Rejected synthetic submission created a ${table} row.`,
    );
  }
}

function confirmFixture(
  submission: ResearchSubmission,
  governance: ReturnType<typeof getResearchGovernanceStatus>,
): void {
  const validation = validateResearchSubmission(submission, governance);
  assert(validation.isValid, `Synthetic ${submission.assessmentMode} fixture is invalid.`);
}

export async function runLocalResearchApiTest(
  environment: EnvironmentSource = process.env,
): Promise<void> {
  const configuration = assertLocalSyntheticResearchTestSafety(environment);
  const governance = getResearchGovernanceStatus(environment);
  assert(
    governance.status === "adult_research_ready",
    "Local adult research governance is not ready.",
  );

  const database = createClient(
    configuration.supabaseUrl.toString(),
    configuration.serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const quick = createSyntheticQuickResearchSubmission();
  const detailed = createSyntheticDetailedResearchSubmission();
  confirmFixture(quick, governance);
  confirmFixture(detailed, governance);

  const quickResponse = await postSubmission(configuration.applicationUrl, quick);
  assert(
    quickResponse.status === 201 &&
      quickResponse.body.success === true &&
      typeof quickResponse.body.publicResearchCode === "string" &&
      typeof quickResponse.body.assessmentId === "string",
    "Synthetic Quick submission was not accepted.",
  );
  const quickAssessmentId = await assessmentIdFor(database, quick.submissionId);
  assert(
    quickAssessmentId === quickResponse.body.assessmentId,
    "Quick API and database assessment IDs differ.",
  );
  await verifySuccessfulWrite(database, quick, quickAssessmentId);
  console.log("PASS: synthetic Quick submission and expected local rows");

  const detailedResponse = await postSubmission(
    configuration.applicationUrl,
    detailed,
  );
  assert(
    detailedResponse.status === 201 &&
      detailedResponse.body.success === true &&
      typeof detailedResponse.body.publicResearchCode === "string" &&
      typeof detailedResponse.body.assessmentId === "string",
    "Synthetic Detailed submission was not accepted.",
  );
  const detailedAssessmentId = await assessmentIdFor(
    database,
    detailed.submissionId,
  );
  assert(
    detailedAssessmentId === detailedResponse.body.assessmentId,
    "Detailed API and database assessment IDs differ.",
  );
  await verifySuccessfulWrite(database, detailed, detailedAssessmentId);
  console.log("PASS: synthetic Detailed submission and expected local rows");

  const duplicateResponse = await postSubmission(
    configuration.applicationUrl,
    quick,
  );
  assert(
    duplicateResponse.status === 409 &&
      duplicateResponse.body.code === "duplicate_submission",
    "Duplicate synthetic submission was not rejected safely.",
  );
  await verifySuccessfulWrite(database, quick, quickAssessmentId);
  console.log("PASS: duplicate Quick submission rejected without extra rows");

  const invalidConsent = cloneSubmission(
    createSyntheticQuickResearchSubmission(),
  );
  invalidConsent.consent.researchConsent = "declined";
  const invalidConsentResponse = await postSubmission(
    configuration.applicationUrl,
    invalidConsent,
  );
  assert(
    invalidConsentResponse.status === 400 &&
      invalidConsentResponse.body.code === "invalid_submission",
    "Invalid-consent synthetic submission was not rejected safely.",
  );
  await verifyNoWrite(database, invalidConsent);
  console.log("PASS: invalid consent rejected without rows");

  const missingRecommendation = cloneSubmission(
    createSyntheticDetailedResearchSubmission(),
  );
  missingRecommendation.recommendationResults.pop();
  const missingRecommendationResponse = await postSubmission(
    configuration.applicationUrl,
    missingRecommendation,
  );
  assert(
    missingRecommendationResponse.status === 400 &&
      missingRecommendationResponse.body.code === "invalid_submission",
    "Incomplete-recommendation synthetic submission was not rejected safely.",
  );
  await verifyNoWrite(database, missingRecommendation);
  console.log("PASS: missing recommendation rejected without rows");

  console.log(
    "\n5 local-only synthetic API scenarios passed against the local Docker Supabase stack.",
  );
}

const directRun = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("/scripts/test-local-research-api.js");

if (directRun) {
  runLocalResearchApiTest().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown local test failure.";
    console.error(message);
    process.exitCode = 1;
  });
}
