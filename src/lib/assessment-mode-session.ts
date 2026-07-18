import type { AssessmentMode } from "../types/assessment-mode";

export const ASSESSMENT_MODE_SESSION_VERSION = 1 as const;
export const ASSESSMENT_MODE_SESSION_KEY =
  "sibau-degree-advisor:assessment-mode:v1";

export interface AssessmentModeSessionPayload {
  version: typeof ASSESSMENT_MODE_SESSION_VERSION;
  selectedMode: AssessmentMode;
}

export type AssessmentModeSessionResolution =
  | { status: "selected"; mode: AssessmentMode }
  | { status: "legacy"; mode: null }
  | { status: "selection-required"; mode: null };

export function isAssessmentMode(value: unknown): value is AssessmentMode {
  return value === "quick" || value === "detailed";
}

export function createAssessmentModeSessionPayload(
  selectedMode: AssessmentMode,
): AssessmentModeSessionPayload {
  return {
    version: ASSESSMENT_MODE_SESSION_VERSION,
    selectedMode,
  };
}

export function serializeAssessmentModeSession(
  selectedMode: AssessmentMode,
): string {
  return JSON.stringify(createAssessmentModeSessionPayload(selectedMode));
}

export function parseAssessmentModeSession(
  serialized: string | null,
): AssessmentModeSessionPayload | null {
  if (serialized === null) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value) ||
      !("version" in value) ||
      !("selectedMode" in value) ||
      value.version !== ASSESSMENT_MODE_SESSION_VERSION ||
      !isAssessmentMode(value.selectedMode)
    ) {
      return null;
    }

    return {
      version: ASSESSMENT_MODE_SESSION_VERSION,
      selectedMode: value.selectedMode,
    };
  } catch {
    return null;
  }
}

/**
 * A missing mode can belong to a valid Version 1 assessment draft. That
 * legacy flow remains available, while malformed or unsupported mode records
 * require a fresh selection.
 */
export function resolveAssessmentModeSession(
  serialized: string | null,
  hasLegacyAssessmentDraft: boolean,
): AssessmentModeSessionResolution {
  const parsed = parseAssessmentModeSession(serialized);
  if (parsed) return { status: "selected", mode: parsed.selectedMode };
  if (serialized === null && hasLegacyAssessmentDraft) {
    return { status: "legacy", mode: null };
  }
  return { status: "selection-required", mode: null };
}
