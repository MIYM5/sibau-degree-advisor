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
export const RESEARCH_VERIFICATION_RPC_NAME =
  "verify_research_submission_counts";

const VERIFICATION_FIELDS = [
  "submission_exists",
  "assessment_id",
  "participant_count",
  "consent_count",
  "assessment_count",
  "subject_mark_count",
  "interest_response_count",
  "riasec_result_count",
  "aptitude_response_count",
  "aptitude_result_count",
  "recommendation_result_count",
  "feedback_count",
  "contact_count",
] as const;

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
  diagnostic?: unknown;
}

export interface ResearchSubmissionVerification {
  submissionExists: boolean;
  assessmentId: string | null;
  participantCount: number;
  consentCount: number;
  assessmentCount: number;
  subjectMarkCount: number;
  interestResponseCount: number;
  riasecResultCount: number;
  aptitudeResponseCount: number;
  aptitudeResultCount: number;
  recommendationResultCount: number;
  feedbackCount: number;
  contactCount: number;
}

function safeDiagnosticValue(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value)
    ? value
    : "unavailable";
}

export function formatLocalApiFailure(
  stage: string,
  status: number,
  body: ApiResponseBody,
): string {
  const diagnostic =
    typeof body.diagnostic === "object" && body.diagnostic !== null
      ? (body.diagnostic as Record<string, unknown>)
      : {};
  return `${stage} failed: HTTP ${status}; API stage=${safeDiagnosticValue(diagnostic.stage)}; diagnostic code=${safeDiagnosticValue(diagnostic.code)}; Supabase code=${safeDiagnosticValue(diagnostic.supabaseCode)}.`;
}

function assertApiResponse(
  condition: unknown,
  stage: string,
  response: { status: number; body: ApiResponseBody },
): asserts condition {
  if (!condition) {
    throw new Error(formatLocalApiFailure(stage, response.status, response.body));
  }
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

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

/** Parse the one aggregate row returned by the verification RPC. */
export function parseResearchVerificationRpcResult(
  value: unknown,
): ResearchSubmissionVerification | null {
  if (!Array.isArray(value) || value.length !== 1) return null;
  const row = value[0];
  if (typeof row !== "object" || row === null || Array.isArray(row)) return null;

  const record = row as Record<string, unknown>;
  const fields = Object.keys(record);
  if (
    fields.length !== VERIFICATION_FIELDS.length ||
    !VERIFICATION_FIELDS.every((field) => fields.includes(field))
  ) {
    return null;
  }

  const counts = VERIFICATION_FIELDS.slice(2).map((field) => record[field]);
  if (
    typeof record.submission_exists !== "boolean" ||
    !(
      record.assessment_id === null ||
      typeof record.assessment_id === "string"
    ) ||
    !counts.every(isCount)
  ) {
    return null;
  }

  if (
    record.submission_exists !== (record.assessment_id !== null) ||
    (!record.submission_exists && counts.some((count) => count !== 0))
  ) {
    return null;
  }

  return {
    submissionExists: record.submission_exists,
    assessmentId: record.assessment_id,
    participantCount: record.participant_count as number,
    consentCount: record.consent_count as number,
    assessmentCount: record.assessment_count as number,
    subjectMarkCount: record.subject_mark_count as number,
    interestResponseCount: record.interest_response_count as number,
    riasecResultCount: record.riasec_result_count as number,
    aptitudeResponseCount: record.aptitude_response_count as number,
    aptitudeResultCount: record.aptitude_result_count as number,
    recommendationResultCount: record.recommendation_result_count as number,
    feedbackCount: record.feedback_count as number,
    contactCount: record.contact_count as number,
  };
}

async function fetchSubmissionVerification(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submissionId: string,
  stage: string,
): Promise<ResearchSubmissionVerification> {
  const result = await resources.runWithTimeout(
    `${stage}: verification RPC`,
    DATABASE_TIMEOUT_MS,
    async (signal) =>
      database
        .rpc(RESEARCH_VERIFICATION_RPC_NAME, {
          p_submission_id: submissionId,
        })
        .abortSignal(signal),
  );
  if (result.error) {
    const safeCode =
      typeof result.error.code === "string" ? result.error.code : "unavailable";
    throw new Error(`${stage} verification RPC failed (${safeCode}).`);
  }
  const verification = parseResearchVerificationRpcResult(result.data);
  if (!verification) {
    throw new Error(`${stage} verification RPC returned an invalid shape.`);
  }
  return verification;
}

async function verifySuccessfulWrite(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submission: ResearchSubmission,
  assessmentId: string,
  stage: string,
): Promise<void> {
  const expectedInterestRows = submission.assessmentMode === "quick" ? 5 : 30;
  const verification = await fetchSubmissionVerification(
    resources,
    database,
    submission.submissionId,
    stage,
  );
  assert(verification.submissionExists, `${stage} did not find the submission.`);
  assert(
    verification.assessmentId === assessmentId,
    `${stage} found an unexpected assessment identifier.`,
  );

  const expected = {
    participantCount: 1,
    consentCount: 1,
    assessmentCount: 1,
    subjectMarkCount: submission.subjectMarks.length,
    interestResponseCount: expectedInterestRows,
    riasecResultCount: 1,
    aptitudeResponseCount: 5,
    aptitudeResultCount: 1,
    recommendationResultCount: programs.length,
    feedbackCount: 0,
    contactCount: 0,
  } satisfies Omit<
    ResearchSubmissionVerification,
    "submissionExists" | "assessmentId"
  >;

  for (const [field, expectedCount] of Object.entries(expected)) {
    const actualCount = verification[
      field as keyof typeof expected
    ] as number;
    assert(
      actualCount === expectedCount,
      `${stage} found an unexpected ${field}: expected ${expectedCount}, received ${actualCount}.`,
    );
  }
}

async function verifyNoWrite(
  resources: LocalResearchTestResources,
  database: SupabaseClient,
  submission: ResearchSubmission,
  stage: string,
): Promise<void> {
  const verification = await fetchSubmissionVerification(
    resources,
    database,
    submission.submissionId,
    stage,
  );
  assert(
    !verification.submissionExists && verification.assessmentId === null,
    `${stage} found records for a rejected submission.`,
  );
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
    assertApiResponse(
      quickResponse.status === 201 &&
        quickResponse.body.success === true &&
        typeof quickResponse.body.publicResearchCode === "string" &&
        typeof quickResponse.body.assessmentId === "string",
      "Quick POST",
      quickResponse,
    );
    passStage("Quick POST");

    startStage("Quick database verification");
    const quickAssessmentId = quickResponse.body.assessmentId as string;
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
    assertApiResponse(
      detailedResponse.status === 201 &&
        detailedResponse.body.success === true &&
        typeof detailedResponse.body.publicResearchCode === "string" &&
        typeof detailedResponse.body.assessmentId === "string",
      "Detailed POST",
      detailedResponse,
    );
    passStage("Detailed POST");

    startStage("duplicate rejection");
    const duplicateResponse = await postSubmission(
      resources,
      configuration.applicationUrl,
      quick,
      "duplicate rejection",
    );
    assertApiResponse(
      duplicateResponse.status === 409 &&
        duplicateResponse.body.code === "duplicate_submission",
      "duplicate rejection",
      duplicateResponse,
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
    assertApiResponse(
      invalidConsentResponse.status === 400 &&
        invalidConsentResponse.body.code === "invalid_submission",
      "invalid-consent rejection",
      invalidConsentResponse,
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
    assertApiResponse(
      missingRecommendationResponse.status === 400 &&
        missingRecommendationResponse.body.code === "invalid_submission",
      "incomplete-program rejection",
      missingRecommendationResponse,
    );
    passStage("incomplete-program rejection");

    startStage("final row-count verification");
    const detailedAssessmentId = detailedResponse.body.assessmentId as string;
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
