export const RESEARCH_RPC_FUNCTION_NAME =
  "submit_research_assessment" as const;
export const RESEARCH_RPC_PARAMETER_NAME = "p_submission" as const;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export type ResearchApiDiagnosticStage =
  | "request_json_parsing"
  | "governance_evaluation"
  | "supabase_configuration_validation"
  | "supabase_client_creation"
  | "research_payload_validation"
  | "rpc_invocation"
  | "rpc_response_receipt"
  | "rpc_result_parsing"
  | "success_response_generation";

export type ResearchApiDiagnosticCode =
  | "started"
  | "completed"
  | "json_required"
  | "payload_too_large"
  | "request_read_failed"
  | "governance_unavailable"
  | "database_configuration_invalid"
  | "client_creation_failed"
  | "payload_invalid"
  | "rpc_transport_failure"
  | "rpc_database_error"
  | "duplicate_submission"
  | "rpc_result_invalid"
  | "success";

export interface SafeResearchApiDiagnostic {
  stage: ResearchApiDiagnosticStage;
  code: ResearchApiDiagnosticCode;
  httpStatus?: number;
  rpcFunction?: typeof RESEARCH_RPC_FUNCTION_NAME;
  supabaseCode?: string;
}

export interface ResearchRpcResult {
  publicResearchCode: string;
  assessmentId: string;
}

type DiagnosticSink = (diagnostic: SafeResearchApiDiagnostic) => void;

function hasLocalHostname(value: string | undefined): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(value ?? "").hostname);
  } catch {
    return false;
  }
}

export function isSafeLocalResearchDiagnosticsEnabled(
  environment: EnvironmentSource,
): boolean {
  return (
    environment.NODE_ENV !== "production" &&
    environment.LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED === "true" &&
    hasLocalHostname(environment.LOCAL_RESEARCH_TEST_APP_URL) &&
    hasLocalHostname(environment.NEXT_PUBLIC_SUPABASE_URL)
  );
}

export function safeSupabaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = String(error.code);
  return /^[A-Za-z0-9_]{1,32}$/.test(code) ? code : "unknown";
}

function safeDiagnostic(
  diagnostic: SafeResearchApiDiagnostic,
): SafeResearchApiDiagnostic {
  return {
    stage: diagnostic.stage,
    code: diagnostic.code,
    ...(Number.isInteger(diagnostic.httpStatus) &&
    Number(diagnostic.httpStatus) >= 100 &&
    Number(diagnostic.httpStatus) <= 599
      ? { httpStatus: diagnostic.httpStatus }
      : {}),
    ...(diagnostic.rpcFunction === RESEARCH_RPC_FUNCTION_NAME
      ? { rpcFunction: RESEARCH_RPC_FUNCTION_NAME }
      : {}),
    ...(diagnostic.supabaseCode
      ? {
          supabaseCode: /^[A-Za-z0-9_]{1,32}$/.test(
            diagnostic.supabaseCode,
          )
            ? diagnostic.supabaseCode
            : "unknown",
        }
      : {}),
  };
}

export interface ResearchApiDiagnosticReporter {
  enabled: boolean;
  log: (diagnostic: SafeResearchApiDiagnostic) => void;
  attach: <T extends Record<string, unknown>>(
    body: T,
    diagnostic: SafeResearchApiDiagnostic,
  ) => T | (T & { diagnostic: SafeResearchApiDiagnostic });
}

export function createResearchApiDiagnosticReporter(
  environment: EnvironmentSource,
  sink: DiagnosticSink = (diagnostic) => {
    console.info("[local-research-api]", diagnostic);
  },
): ResearchApiDiagnosticReporter {
  const enabled = isSafeLocalResearchDiagnosticsEnabled(environment);
  return {
    enabled,
    log(diagnostic) {
      if (enabled) sink(safeDiagnostic(diagnostic));
    },
    attach(body, diagnostic) {
      return enabled
        ? { ...body, diagnostic: safeDiagnostic(diagnostic) }
        : body;
    },
  };
}

export function parseResearchRpcResult(data: unknown): ResearchRpcResult | null {
  const result = Array.isArray(data) ? data[0] : data;
  if (
    typeof result !== "object" ||
    result === null ||
    !("public_research_code" in result) ||
    !("assessment_id" in result) ||
    typeof result.public_research_code !== "string" ||
    typeof result.assessment_id !== "string"
  ) {
    return null;
  }
  return {
    publicResearchCode: result.public_research_code,
    assessmentId: result.assessment_id,
  };
}
