import type { AssessmentMode } from "./assessment-mode";

export type AgeGroup = "under_16" | "age_16_17" | "age_18_or_above";

export type ConsentChoice = "granted" | "declined";

export type GuardianConsentStatus =
  | "not_applicable"
  | "required_not_collected"
  | "future_approved_process_required";

export type ResearchStorageEligibility =
  | "eligible"
  | "not_eligible_no_research_consent"
  | "not_eligible_minor_process_required"
  | "not_eligible_invalid_consent";

export interface ConsentRecord {
  schemaVersion: 1;
  participantSessionId: string;
  assessmentMode: AssessmentMode;
  ageGroup: AgeGroup;
  operationalConsent: true;
  researchConsent: ConsentChoice;
  followUpContactConsent: ConsentChoice;
  analyticsConsent: ConsentChoice;
  guardianConsentStatus: GuardianConsentStatus;
  researchStorageEligibility: ResearchStorageEligibility;
  privacyPolicyVersion: string;
  consentTextVersion: string;
  consentTimestamp: string;
}

export interface ConsentSessionPayload {
  schemaVersion: 1;
  consent: ConsentRecord;
}

export interface ConsentValidationError {
  field: keyof ConsentRecord | "payload" | "session";
  code: string;
  message: string;
}

export interface ConsentValidationResult {
  isValid: boolean;
  consent?: ConsentRecord;
  errors: ConsentValidationError[];
}
