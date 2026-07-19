import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { programs } from "../src/data/programs";
import { getResearchGovernanceStatus } from "../src/lib/research-governance";
import { validateResearchSubmission } from "../src/lib/research-record-validation";
import type { ResearchSubmission } from "../src/types/research-submission";
import { createSyntheticDetailedResearchSubmission } from "./fixtures/synthetic-detailed-research-submission";
import { createSyntheticQuickResearchSubmission } from "./fixtures/synthetic-quick-research-submission";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
const HTTP_TIMEOUT_MS = 30_000;
const DATABASE_TIMEOUT_MS = 15_000;
const CLEANUP_TIMEOUT_MS = 2_000;

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

export class LocalResearchTestTimeoutError extends Error {
  constructor(
    public readonly stage: string,
    public readonly timeoutMs: number,
  ) {
    super(`${stage} timed out after ${timeoutMs} ms.`);
    this.name = "LocalResearchTestTimeoutError";
  }
}

type CleanupAction = () => void | Promise<void>;

/** Tracks every timeout, abort controller, and explicit client cleanup action. */
export class LocalResearchTestResources {
  private readonly activeControllers = new Set<AbortController>();
  private readonly cleanupActions: CleanupAction[] = [];
  private cleaned = false;

  get activeOperationCount(): number {
    return this.activeControllers.size;
  }

  registerCleanup(action: CleanupAction): void {
    if (this.cleaned) {
      throw new Error("Cannot register cleanup after resources were released.");
    }
    this.cleanupActions.push(action);
  }

  async runWithTimeout<T>(
    stage: string,
    timeoutMs: number,
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    if (this.cleaned) {
      throw new Error(`${stage} cannot start after resource cleanup.`);
    }
    const controller = new AbortController();
    this.activeControllers.add(controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new LocalResearchTestTimeoutError(stage, timeoutMs);
        controller.abort(error);
        reject(error);
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        Promise.resolve().then(() => operation(controller.signal)),
        timeout,
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      this.activeControllers.delete(controller);
    }
  }

  async cleanup(): Promise<void> {
    if (this.cleaned) return;
    this.cleaned = true;
    for (const controller of this.activeControllers) controller.abort();
    this.activeControllers.clear();

    for (const action of this.cleanupActions.reverse()) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new LocalResearchTestTimeoutError(
                "Local test resource cleanup",
                CLEANUP_TIMEOUT_MS,
              ),
            ),
          CLEANUP_TIMEOUT_MS,
        );
      });
      try {
        await Promise.race([Promise.resolve().then(action), timeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    this.cleanupActions.length = 0;
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

function startStage(stage: string): void {
  console.log(`START: ${stage}`);
}

function passStage(stage: string): void {
  console.log(`PASS: ${stage}`);
}

interface ApiResponseBody {
  success?: unknown;
  code?: unknown;
  publicResearchCode?: unknown;
  assessmentId?: unknown;
}

function closeConnectionFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(
    input instanceof Request ? input.headers : undefined,
  );
  new Headers(init?.headers).forEach((value, name) => {
    headers.set(name, value);
  });
  headers.set("connection", "close");
  return fetch(input, { ...init, headers });
}

async function postSubmission(
  resources: LocalResearchTestResources,
  applicationUrl: URL,
  submission: ResearchSubmission,
  stage: string,
): Promise<{ status: number; body: ApiResponseBody }> {
  return resources.runWithTimeout(stage, HTTP_TIMEOUT_MS, async (signal) => {
    const endpoint = new URL("/api/research-submissions", applicationUrl);
    let response: Response;
    try {
      response = await closeConnectionFetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
        signal,
      });
    } catch (error) {
      if (error instanceof LocalResearchTestTimeoutError) throw error;
      if (signal.aborted && signal.reason instanceof Error) throw signal.reason;
      throw new Error(`${stage} could not reach the local application.`);
    }

    try {
      const body = (await response.json()) as ApiResponseBody;
      return { status: response.status, body };
    } catch {
      throw new Error(`${stage} returned an unreadable JSON response.`);
    }
  });
}

async function rowCount(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  table: string,
  column: string,
  value: string,
  stage: string,
): Promise<number> {
  const result = await resources.runWithTimeout(
    `${stage}: ${table}`,
    DATABASE_TIMEOUT_MS,
    async (signal) =>
      database
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, value)
        .abortSignal(signal),
  );
  if (result.error || result.count === null) {
    throw new Error(`${stage} failed while counting ${table}.`);
  }
  return result.count;
}

async function assessmentIdFor(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submissionId: string,
  stage: string,
): Promise<string> {
  const result = await resources.runWithTimeout(
    `${stage}: assessment lookup`,
    DATABASE_TIMEOUT_MS,
    async (signal) =>
      database
        .from("assessments")
        .select("id")
        .eq("submission_id", submissionId)
        .abortSignal(signal)
        .single(),
  );
  if (result.error || typeof result.data?.id !== "string") {
    throw new Error(`${stage} failed during assessment lookup.`);
  }
  return result.data.id;
}

async function verifySuccessfulWrite(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submission: ResearchSubmission,
  assessmentId: string,
  stage: string,
): Promise<void> {
  const expectedInterestRows = submission.assessmentMode === "quick" ? 5 : 30;
  const expected = [
    ["participants", "id", submission.participantAnonymousId, 1],
    ["consents", "submission_id", submission.submissionId, 1],
    ["assessments", "submission_id", submission.submissionId, 1],
    [
      "subject_marks",
      "assessment_id",
      assessmentId,
      submission.subjectMarks.length,
    ],
    ["interest_responses", "assessment_id", assessmentId, expectedInterestRows],
    ["riasec_scores", "assessment_id", assessmentId, 1],
    ["aptitude_responses", "assessment_id", assessmentId, 5],
    ["aptitude_results", "assessment_id", assessmentId, 1],
    ["recommendation_results", "assessment_id", assessmentId, programs.length],
    ["assessment_feedback", "assessment_id", assessmentId, 0],
    [
      "participant_contacts",
      "participant_id",
      submission.participantAnonymousId,
      0,
    ],
  ] as const;

  for (const [table, column, value, expectedCount] of expected) {
    const actualCount = await rowCount(
      resources,
      database,
      table,
      column,
      value,
      stage,
    );
    assert(
      actualCount === expectedCount,
      `${stage} found an unexpected ${table} row count: expected ${expectedCount}, received ${actualCount}.`,
    );
  }
}

async function verifyNoWrite(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submission: ResearchSubmission,
  stage: string,
): Promise<void> {
  const checks = [
    ["participants", "id", submission.participantAnonymousId],
    ["consents", "submission_id", submission.submissionId],
    ["assessments", "submission_id", submission.submissionId],
  ] as const;
  for (const [table, column, value] of checks) {
    assert(
      (await rowCount(
        resources,
        database,
        table,
        column,
        value,
        stage,
      )) === 0,
      `${stage} found an unexpected ${table} row.`,
    );
  }
}

function confirmFixture(
  submission: ResearchSubmission,
  governance: ReturnType<typeof getResearchGovernanceStatus>,
): void {
  const validation = validateResearchSubmission(submission, governance);
  assert(
    validation.isValid,
    `Synthetic ${submission.assessmentMode} fixture is invalid.`,
  );
}

function createLocalDatabaseClient(
  configuration: LocalResearchTestConfiguration,
): SupabaseClient {
  return createClient(
    configuration.supabaseUrl.toString(),
    configuration.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: closeConnectionFetch },
    },
  );
}

export async function runLocalResearchApiTest(
  environment: EnvironmentSource = process.env,
): Promise<void> {
  const resources = new LocalResearchTestResources();
  let runError: unknown = null;

  try {
    startStage("safety checks");
    const configuration = assertLocalSyntheticResearchTestSafety(environment);
    const governance = getResearchGovernanceStatus(environment);
    assert(
      governance.status === "adult_research_ready",
      "Local adult research governance is not ready.",
    );
    passStage("safety checks");

    const database = createLocalDatabaseClient(configuration);
    resources.registerCleanup(async () => {
      database.auth.stopAutoRefresh();
      database.realtime.disconnect();
      await database.removeAllChannels();
    });

    const quick = createSyntheticQuickResearchSubmission();
    const detailed = createSyntheticDetailedResearchSubmission();

    startStage("Quick payload validation");
    confirmFixture(quick, governance);
    passStage("Quick payload validation");

    startStage("Quick POST");
    const quickResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      quick,
      "Quick POST",
    );
    assert(
      quickResponse.status === 201 &&
        quickResponse.body.success === true &&
        typeof quickResponse.body.publicResearchCode === "string" &&
        typeof quickResponse.body.assessmentId === "string",
      "Synthetic Quick submission was not accepted.",
    );
    passStage("Quick POST");

    startStage("Quick database verification");
    const quickAssessmentId = await assessmentIdFor(
      resources,
      database,
      quick.submissionId,
      "Quick database verification",
    );
    assert(
      quickAssessmentId === quickResponse.body.assessmentId,
      "Quick API and database assessment IDs differ.",
    );
    await verifySuccessfulWrite(
      resources,
      database,
      quick,
      quickAssessmentId,
      "Quick database verification",
    );
    passStage("Quick database verification");

    confirmFixture(detailed, governance);
    startStage("Detailed POST");
    const detailedResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      detailed,
      "Detailed POST",
    );
    assert(
      detailedResponse.status === 201 &&
        detailedResponse.body.success === true &&
        typeof detailedResponse.body.publicResearchCode === "string" &&
        typeof detailedResponse.body.assessmentId === "string",
      "Synthetic Detailed submission was not accepted.",
    );
    passStage("Detailed POST");

    startStage("duplicate rejection");
    const duplicateResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      quick,
      "duplicate rejection",
    );
    assert(
      duplicateResponse.status === 409 &&
        duplicateResponse.body.code === "duplicate_submission",
      "Duplicate synthetic submission was not rejected safely.",
    );
    passStage("duplicate rejection");

    const invalidConsent = cloneSubmission(
      createSyntheticQuickResearchSubmission(),
    );
    invalidConsent.consent.researchConsent = "declined";
    startStage("invalid-consent rejection");
    const invalidConsentResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      invalidConsent,
      "invalid-consent rejection",
    );
    assert(
      invalidConsentResponse.status === 400 &&
        invalidConsentResponse.body.code === "invalid_submission",
      "Invalid-consent synthetic submission was not rejected safely.",
    );
    passStage("invalid-consent rejection");

    const missingRecommendation = cloneSubmission(
      createSyntheticDetailedResearchSubmission(),
    );
    missingRecommendation.recommendationResults.pop();
    startStage("incomplete-program rejection");
    const missingRecommendationResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      missingRecommendation,
      "incomplete-program rejection",
    );
    assert(
      missingRecommendationResponse.status === 400 &&
        missingRecommendationResponse.body.code === "invalid_submission",
      "Incomplete-recommendation synthetic submission was not rejected safely.",
    );
    passStage("incomplete-program rejection");

    startStage("final row-count verification");
    const detailedAssessmentId = await assessmentIdFor(
      resources,
      database,
      detailed.submissionId,
      "final row-count verification",
    );
    assert(
      detailedAssessmentId === detailedResponse.body.assessmentId,
      "Detailed API and database assessment IDs differ.",
    );
    await verifySuccessfulWrite(
      resources,
      database,
      quick,
      quickAssessmentId,
      "final row-count verification for Quick submission",
    );
    await verifySuccessfulWrite(
      resources,
      database,
      detailed,
      detailedAssessmentId,
      "final row-count verification for Detailed submission",
    );
    await verifyNoWrite(
      resources,
      database,
      invalidConsent,
      "final row-count verification for invalid consent",
    );
    await verifyNoWrite(
      resources,
      database,
      missingRecommendation,
      "final row-count verification for incomplete program coverage",
    );
    passStage("final row-count verification");

    console.log(
      "\n5 local-only synthetic API scenarios passed against the local Docker Supabase stack.",
    );
  } catch (error) {
    runError = error;
    throw error;
  } finally {
    startStage("resource cleanup");
    try {
      await resources.cleanup();
      passStage("resource cleanup");
    } catch (cleanupError) {
      if (runError) {
        console.error("Resource cleanup also failed after the test error.");
      } else {
        throw cleanupError;
      }
    }
  }
}

const directRun = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("/scripts/test-local-research-api.js");

async function main(): Promise<void> {
  process.exitCode = 1;
  try {
    await runLocalResearchApiTest();
    process.exitCode = 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown local test failure.";
    console.error(message);
  }
}

if (directRun) void main();
