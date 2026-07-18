import {
  CONSENT_TEXT_VERSION,
  PRIVACY_POLICY_VERSION,
} from "../data/privacy-policy";
import type { AssessmentMode } from "../types/assessment-mode";
import type {
  AgeGroup,
  ConsentChoice,
  ConsentRecord,
  ConsentSessionPayload,
  ConsentValidationError,
  ConsentValidationResult,
  GuardianConsentStatus,
  ResearchStorageEligibility,
} from "../types/consent";

export const CONSENT_PAYLOAD_SCHEMA_VERSION = 1 as const;
export const CONSENT_SESSION_KEY = "sibau-degree-advisor:consent:v1";

export const INITIAL_CONSENT_CHOICES = Object.freeze({
  ageGroup: null,
  operationalConsent: false,
  researchConsent: false,
  followUpContactConsent: false,
  analyticsConsent: false,
});

interface CreateConsentRecordInput {
  assessmentMode: AssessmentMode;
  ageGroup: AgeGroup;
  operationalConsent: boolean;
  researchConsent: boolean;
  followUpContactConsent: boolean;
  analyticsConsent: boolean;
  participantSessionId?: string;
  consentTimestamp?: string;
}

const consentFields = new Set([
  "schemaVersion",
  "participantSessionId",
  "assessmentMode",
  "ageGroup",
  "operationalConsent",
  "researchConsent",
  "followUpContactConsent",
  "analyticsConsent",
  "guardianConsentStatus",
  "researchStorageEligibility",
  "privacyPolicyVersion",
  "consentTextVersion",
  "consentTimestamp",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssessmentMode(value: unknown): value is AssessmentMode {
  return value === "quick" || value === "detailed";
}

function isAgeGroup(value: unknown): value is AgeGroup {
  return (
    value === "under_16" ||
    value === "age_16_17" ||
    value === "age_18_or_above"
  );
}

function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "declined";
}

function isGuardianStatus(value: unknown): value is GuardianConsentStatus {
  return (
    value === "not_applicable" ||
    value === "required_not_collected" ||
    value === "future_approved_process_required"
  );
}

function isResearchEligibility(
  value: unknown,
): value is ResearchStorageEligibility {
  return (
    value === "eligible" ||
    value === "not_eligible_no_research_consent" ||
    value === "not_eligible_minor_process_required" ||
    value === "not_eligible_invalid_consent"
  );
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function isValidAnonymousParticipantId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function anonymousParticipantId(): string {
  return globalThis.crypto.randomUUID();
}

function choice(value: boolean): ConsentChoice {
  return value ? "granted" : "declined";
}

function validationError(
  field: ConsentValidationError["field"],
  code: string,
  message: string,
): ConsentValidationError {
  return { field, code, message };
}

export function deriveGuardianConsentStatus(
  ageGroup: AgeGroup,
): GuardianConsentStatus {
  if (ageGroup === "age_18_or_above") return "not_applicable";
  if (ageGroup === "age_16_17") {
    return "future_approved_process_required";
  }
  return "required_not_collected";
}

export function deriveResearchStorageEligibility(
  ageGroup: AgeGroup,
  operationalConsent: boolean,
  researchConsent: ConsentChoice,
): ResearchStorageEligibility {
  if (!operationalConsent) return "not_eligible_invalid_consent";
  if (ageGroup !== "age_18_or_above") {
    return "not_eligible_minor_process_required";
  }
  return researchConsent === "granted"
    ? "eligible"
    : "not_eligible_no_research_consent";
}

export function validateConsentRecord(value: unknown): ConsentValidationResult {
  const errors: ConsentValidationError[] = [];
  if (!isRecord(value)) {
    return {
      isValid: false,
      errors: [
        validationError(
          "payload",
          "malformed_payload",
          "Consent must be an object.",
        ),
      ],
    };
  }

  if (Object.keys(value).some((field) => !consentFields.has(field))) {
    errors.push(
      validationError(
        "payload",
        "unknown_field",
        "Consent contains an unknown or disallowed field.",
      ),
    );
  }
  if (value.schemaVersion !== CONSENT_PAYLOAD_SCHEMA_VERSION) {
    errors.push(
      validationError(
        "schemaVersion",
        "schema_version_mismatch",
        "Consent uses an unsupported schema version.",
      ),
    );
  }
  if (!isValidAnonymousParticipantId(value.participantSessionId)) {
    errors.push(
      validationError(
        "participantSessionId",
        "invalid_participant_session_id",
        "Anonymous participant/session ID is invalid.",
      ),
    );
  }
  if (!isAssessmentMode(value.assessmentMode)) {
    errors.push(
      validationError(
        "assessmentMode",
        "unknown_assessment_mode",
        "Assessment mode must be Quick or Detailed Guidance.",
      ),
    );
  }
  if (!isAgeGroup(value.ageGroup)) {
    errors.push(
      validationError(
        "ageGroup",
        "unknown_age_group",
        "Select a recognized age group.",
      ),
    );
  }
  if (value.operationalConsent !== true) {
    errors.push(
      validationError(
        "operationalConsent",
        "operational_consent_required",
        "Required operational consent must be granted to access the assessment.",
      ),
    );
  }
  for (const [field, consentChoice] of [
    ["researchConsent", value.researchConsent],
    ["followUpContactConsent", value.followUpContactConsent],
    ["analyticsConsent", value.analyticsConsent],
  ] as const) {
    if (!isConsentChoice(consentChoice)) {
      errors.push(
        validationError(
          field,
          "invalid_consent_choice",
          "Optional consent must be recorded as granted or declined.",
        ),
      );
    }
  }
  if (!isGuardianStatus(value.guardianConsentStatus)) {
    errors.push(
      validationError(
        "guardianConsentStatus",
        "unknown_guardian_status",
        "Guardian-consent status is invalid.",
      ),
    );
  }
  if (!isResearchEligibility(value.researchStorageEligibility)) {
    errors.push(
      validationError(
        "researchStorageEligibility",
        "unknown_research_storage_eligibility",
        "Research-storage eligibility is invalid.",
      ),
    );
  }
  if (value.privacyPolicyVersion !== PRIVACY_POLICY_VERSION) {
    errors.push(
      validationError(
        "privacyPolicyVersion",
        "privacy_policy_version_mismatch",
        "The stored privacy-policy version is not current.",
      ),
    );
  }
  if (value.consentTextVersion !== CONSENT_TEXT_VERSION) {
    errors.push(
      validationError(
        "consentTextVersion",
        "consent_text_version_mismatch",
        "The stored consent-text version is not current.",
      ),
    );
  }
  if (!isValidIsoTimestamp(value.consentTimestamp)) {
    errors.push(
      validationError(
        "consentTimestamp",
        "invalid_timestamp",
        "Consent timestamp must be a valid ISO timestamp.",
      ),
    );
  }

  if (isAgeGroup(value.ageGroup) && isGuardianStatus(value.guardianConsentStatus)) {
    const expectedGuardianStatus = deriveGuardianConsentStatus(value.ageGroup);
    if (value.guardianConsentStatus !== expectedGuardianStatus) {
      errors.push(
        validationError(
          "guardianConsentStatus",
          "inconsistent_guardian_status",
          "Guardian-consent status does not match the selected age group.",
        ),
      );
    }
  }

  if (
    isAgeGroup(value.ageGroup) &&
    isConsentChoice(value.researchConsent) &&
    isResearchEligibility(value.researchStorageEligibility)
  ) {
    const expectedEligibility = deriveResearchStorageEligibility(
      value.ageGroup,
      value.operationalConsent === true,
      value.researchConsent,
    );
    if (value.researchStorageEligibility !== expectedEligibility) {
      errors.push(
        validationError(
          "researchStorageEligibility",
          value.ageGroup === "age_18_or_above"
            ? "inconsistent_research_storage_eligibility"
            : "minor_research_storage_not_allowed",
          "Research-storage eligibility does not match the recorded consent and age group.",
        ),
      );
    }
  }

  if (errors.length > 0) return { isValid: false, errors };

  return {
    isValid: true,
    consent: {
      schemaVersion: CONSENT_PAYLOAD_SCHEMA_VERSION,
      participantSessionId: value.participantSessionId as string,
      assessmentMode: value.assessmentMode as AssessmentMode,
      ageGroup: value.ageGroup as AgeGroup,
      operationalConsent: true,
      researchConsent: value.researchConsent as ConsentChoice,
      followUpContactConsent: value.followUpContactConsent as ConsentChoice,
      analyticsConsent: value.analyticsConsent as ConsentChoice,
      guardianConsentStatus:
        value.guardianConsentStatus as GuardianConsentStatus,
      researchStorageEligibility:
        value.researchStorageEligibility as ResearchStorageEligibility,
      privacyPolicyVersion: value.privacyPolicyVersion as string,
      consentTextVersion: value.consentTextVersion as string,
      consentTimestamp: value.consentTimestamp as string,
    },
    errors: [],
  };
}

export function createConsentRecord(
  input: CreateConsentRecordInput,
): ConsentValidationResult {
  const researchConsent = choice(input.researchConsent);
  return validateConsentRecord({
    schemaVersion: CONSENT_PAYLOAD_SCHEMA_VERSION,
    participantSessionId:
      input.participantSessionId ?? anonymousParticipantId(),
    assessmentMode: input.assessmentMode,
    ageGroup: input.ageGroup,
    operationalConsent: input.operationalConsent,
    researchConsent,
    followUpContactConsent: choice(input.followUpContactConsent),
    analyticsConsent: choice(input.analyticsConsent),
    guardianConsentStatus: deriveGuardianConsentStatus(input.ageGroup),
    researchStorageEligibility: deriveResearchStorageEligibility(
      input.ageGroup,
      input.operationalConsent,
      researchConsent,
    ),
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    consentTextVersion: CONSENT_TEXT_VERSION,
    consentTimestamp: input.consentTimestamp ?? new Date().toISOString(),
  });
}

export function createConsentSessionPayload(
  consent: ConsentRecord,
): ConsentSessionPayload {
  const validation = validateConsentRecord(consent);
  if (!validation.isValid || !validation.consent) {
    throw new RangeError("Cannot create a session payload from invalid consent.");
  }
  return {
    schemaVersion: CONSENT_PAYLOAD_SCHEMA_VERSION,
    consent: validation.consent,
  };
}

export function serializeConsentSession(consent: ConsentRecord): string {
  return JSON.stringify(createConsentSessionPayload(consent));
}

export function parseConsentSessionPayload(
  serialized: string | null,
): ConsentSessionPayload | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    if (
      !isRecord(value) ||
      Object.keys(value).some(
        (field) => !["schemaVersion", "consent"].includes(field),
      ) ||
      value.schemaVersion !== CONSENT_PAYLOAD_SCHEMA_VERSION
    ) {
      return null;
    }
    const validation = validateConsentRecord(value.consent);
    if (!validation.isValid || !validation.consent) return null;
    return {
      schemaVersion: CONSENT_PAYLOAD_SCHEMA_VERSION,
      consent: validation.consent,
    };
  } catch {
    return null;
  }
}

export function canAccessAssessmentWithConsent(
  serialized: string | null,
  assessmentMode: AssessmentMode,
): boolean {
  const payload = parseConsentSessionPayload(serialized);
  return (
    payload?.consent.operationalConsent === true &&
    payload.consent.assessmentMode === assessmentMode
  );
}

export function resolveConsentAccess(
  serialized: string | null,
  assessmentMode: AssessmentMode,
  hasValidLegacyVersion1Draft: boolean,
): "allowed" | "consent-required" {
  if (hasValidLegacyVersion1Draft) return "allowed";
  return canAccessAssessmentWithConsent(serialized, assessmentMode)
    ? "allowed"
    : "consent-required";
}
