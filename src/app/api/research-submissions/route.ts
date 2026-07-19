import { NextResponse } from "next/server";

import {
  MAX_RESEARCH_SUBMISSION_BYTES,
  isDuplicateDatabaseError,
  parseResearchSubmissionJson,
  toResearchDatabaseSubmission,
  validateResearchDatabaseConfig,
} from "@/lib/research-record-validation";
import { getResearchGovernanceStatus } from "@/lib/research-governance";
import {
  RESEARCH_RPC_FUNCTION_NAME,
  createResearchApiDiagnosticReporter,
  parseResearchRpcResult,
  safeSupabaseErrorCode,
  type ResearchApiDiagnosticReporter,
  type SafeResearchApiDiagnostic,
} from "@/lib/research-api-diagnostics";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(
  status: number,
  code: string,
  message: string,
  diagnostics: ResearchApiDiagnosticReporter,
  diagnostic: Omit<SafeResearchApiDiagnostic, "httpStatus">,
): NextResponse {
  const safeDiagnostic = { ...diagnostic, httpStatus: status };
  diagnostics.log(safeDiagnostic);
  return NextResponse.json(
    diagnostics.attach({ success: false, code, message }, safeDiagnostic),
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const diagnostics = createResearchApiDiagnosticReporter(process.env);
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return response(
      415,
      "json_required",
      "A JSON request is required.",
      diagnostics,
      { stage: "request_json_parsing", code: "json_required" },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_RESEARCH_SUBMISSION_BYTES
  ) {
    return response(
      413,
      "payload_too_large",
      "The request is too large.",
      diagnostics,
      { stage: "request_json_parsing", code: "payload_too_large" },
    );
  }

  diagnostics.log({ stage: "governance_evaluation", code: "started" });
  const governance = getResearchGovernanceStatus();
  if (
    governance.status === "guidance_only" ||
    !governance.config.researchDataCollectionEnabled
  ) {
    return response(
      503,
      "research_collection_unavailable",
      "Research collection is currently unavailable.",
      diagnostics,
      {
        stage: "governance_evaluation",
        code: "governance_unavailable",
      },
    );
  }
  diagnostics.log({ stage: "governance_evaluation", code: "completed" });

  diagnostics.log({
    stage: "supabase_configuration_validation",
    code: "started",
  });
  const databaseConfiguration = validateResearchDatabaseConfig(process.env);
  if (!databaseConfiguration.isConfigured) {
    return response(
      503,
      "research_database_unavailable",
      "Research collection is currently unavailable.",
      diagnostics,
      {
        stage: "supabase_configuration_validation",
        code: "database_configuration_invalid",
      },
    );
  }
  diagnostics.log({
    stage: "supabase_configuration_validation",
    code: "completed",
  });

  diagnostics.log({ stage: "supabase_client_creation", code: "started" });
  let database: ReturnType<typeof createServerSupabaseClient>;
  try {
    database = createServerSupabaseClient();
  } catch {
    return response(
      500,
      "research_submission_failed",
      "The submission could not be stored.",
      diagnostics,
      {
        stage: "supabase_client_creation",
        code: "client_creation_failed",
      },
    );
  }
  if (!database.isConfigured) {
    return response(
      503,
      database.errorCode,
      "Research collection is currently unavailable.",
      diagnostics,
      {
        stage: "supabase_client_creation",
        code: "database_configuration_invalid",
      },
    );
  }
  diagnostics.log({ stage: "supabase_client_creation", code: "completed" });

  diagnostics.log({ stage: "request_json_parsing", code: "started" });
  let serialized: string;
  try {
    serialized = await request.text();
  } catch {
    return response(
      400,
      "invalid_request",
      "The request could not be read.",
      diagnostics,
      {
        stage: "request_json_parsing",
        code: "request_read_failed",
      },
    );
  }
  diagnostics.log({ stage: "request_json_parsing", code: "completed" });

  diagnostics.log({ stage: "research_payload_validation", code: "started" });
  const validation = parseResearchSubmissionJson(serialized, governance);
  if (!validation.isValid) {
    const oversized = validation.issues.some(
      ({ code }) => code === "payload_too_large",
    );
    return response(
      oversized ? 413 : 400,
      oversized ? "payload_too_large" : "invalid_submission",
      oversized ? "The request is too large." : "The submission is invalid.",
      diagnostics,
      {
        stage: "research_payload_validation",
        code: oversized ? "payload_too_large" : "payload_invalid",
      },
    );
  }
  diagnostics.log({
    stage: "research_payload_validation",
    code: "completed",
  });

  const databasePayload = toResearchDatabaseSubmission(validation.submission);
  diagnostics.log({
    stage: "rpc_invocation",
    code: "started",
    rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
  });
  diagnostics.log({
    stage: "rpc_response_receipt",
    code: "started",
    rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
  });
  let rpcResponse: Awaited<
    ReturnType<typeof database.client.rpc>
  >;
  try {
    rpcResponse = await database.client.rpc("submit_research_assessment", {
      p_submission: databasePayload,
    });
  } catch {
    return response(
      500,
      "research_submission_failed",
      "The submission could not be stored.",
      diagnostics,
      {
        stage: "rpc_invocation",
        code: "rpc_transport_failure",
        rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
      },
    );
  }
  diagnostics.log({
    stage: "rpc_invocation",
    code: "completed",
    rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
  });
  diagnostics.log({
    stage: "rpc_response_receipt",
    code: "completed",
    rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
    ...(safeSupabaseErrorCode(rpcResponse.error)
      ? { supabaseCode: safeSupabaseErrorCode(rpcResponse.error) }
      : {}),
  });

  const { data, error } = rpcResponse;

  if (error) {
    if (isDuplicateDatabaseError(error)) {
      return response(
        409,
        "duplicate_submission",
        "This submission has already been received.",
        diagnostics,
        {
          stage: "rpc_response_receipt",
          code: "duplicate_submission",
          rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
          supabaseCode: safeSupabaseErrorCode(error),
        },
      );
    }
    return response(
      500,
      "research_submission_failed",
      "The submission could not be stored.",
      diagnostics,
      {
        stage: "rpc_response_receipt",
        code: "rpc_database_error",
        rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
        supabaseCode: safeSupabaseErrorCode(error),
      },
    );
  }

  diagnostics.log({ stage: "rpc_result_parsing", code: "started" });
  const result = parseResearchRpcResult(data);
  if (!result) {
    return response(
      500,
      "research_submission_failed",
      "The submission could not be confirmed.",
      diagnostics,
      {
        stage: "rpc_result_parsing",
        code: "rpc_result_invalid",
        rpcFunction: RESEARCH_RPC_FUNCTION_NAME,
      },
    );
  }
  diagnostics.log({ stage: "rpc_result_parsing", code: "completed" });

  diagnostics.log({
    stage: "success_response_generation",
    code: "started",
  });
  diagnostics.log({
    stage: "success_response_generation",
    code: "success",
    httpStatus: 201,
  });
  return NextResponse.json(
    {
      success: true,
      publicResearchCode: result.publicResearchCode,
      assessmentId: result.assessmentId,
    },
    { status: 201 },
  );
}
