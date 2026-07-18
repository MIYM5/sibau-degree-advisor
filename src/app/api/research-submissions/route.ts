import { NextResponse } from "next/server";

import {
  MAX_RESEARCH_SUBMISSION_BYTES,
  isDuplicateDatabaseError,
  parseResearchSubmissionJson,
  toResearchDatabaseSubmission,
} from "@/lib/research-record-validation";
import { getResearchGovernanceStatus } from "@/lib/research-governance";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return response(415, "json_required", "A JSON request is required.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_RESEARCH_SUBMISSION_BYTES
  ) {
    return response(413, "payload_too_large", "The request is too large.");
  }

  const governance = getResearchGovernanceStatus();
  if (
    governance.status === "guidance_only" ||
    !governance.config.researchDataCollectionEnabled
  ) {
    return response(
      503,
      "research_collection_unavailable",
      "Research collection is currently unavailable.",
    );
  }

  const database = createServerSupabaseClient();
  if (!database.isConfigured) {
    return response(
      503,
      database.errorCode,
      "Research collection is currently unavailable.",
    );
  }

  let serialized: string;
  try {
    serialized = await request.text();
  } catch {
    return response(400, "invalid_request", "The request could not be read.");
  }

  const validation = parseResearchSubmissionJson(serialized, governance);
  if (!validation.isValid) {
    const oversized = validation.issues.some(
      ({ code }) => code === "payload_too_large",
    );
    return response(
      oversized ? 413 : 400,
      oversized ? "payload_too_large" : "invalid_submission",
      oversized ? "The request is too large." : "The submission is invalid.",
    );
  }

  const databasePayload = toResearchDatabaseSubmission(validation.submission);
  const { data, error } = await database.client.rpc(
    "submit_research_assessment",
    { p_submission: databasePayload },
  );

  if (error) {
    if (isDuplicateDatabaseError(error)) {
      return response(
        409,
        "duplicate_submission",
        "This submission has already been received.",
      );
    }
    return response(
      500,
      "research_submission_failed",
      "The submission could not be stored.",
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (
    typeof result !== "object" ||
    result === null ||
    typeof result.public_research_code !== "string" ||
    typeof result.assessment_id !== "string"
  ) {
    return response(
      500,
      "research_submission_failed",
      "The submission could not be confirmed.",
    );
  }

  return NextResponse.json(
    {
      success: true,
      publicResearchCode: result.public_research_code,
      assessmentId: result.assessment_id,
    },
    { status: 201 },
  );
}
