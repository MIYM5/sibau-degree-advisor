import {
  CONSENT_TEXT_VERSION,
  PRIVACY_POLICY_VERSION,
} from "../src/data/privacy-policy";
import { ASSESSMENT_FEEDBACK_SESSION_KEY } from "../src/lib/assessment-feedback";
import {
  ASSESSMENT_MODE_SESSION_KEY,
} from "../src/lib/assessment-mode-session";
import {
  ASSESSMENT_DRAFT_SESSION_KEY,
  RECOMMENDATION_SESSION_KEY,
} from "../src/lib/assessment-session";
import {
  CONSENT_SESSION_KEY,
  INITIAL_CONSENT_CHOICES,
  canAccessAssessmentWithConsent,
  createConsentRecord,
  deriveResearchStorageEligibility,
  isValidAnonymousParticipantId,
  parseConsentSessionPayload,
  resolveConsentAccess,
  serializeConsentSession,
  validateConsentRecord,
} from "../src/lib/consent-session";
import type { AssessmentMode } from "../src/types/assessment-mode";
import type { AgeGroup, ConsentRecord } from "../src/types/consent";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function hasError(
  result: ReturnType<typeof validateConsentRecord>,
  code: string,
): boolean {
  return result.errors.some((item) => item.code === code);
}

function consent(
  options: {
    mode?: AssessmentMode;
    ageGroup?: AgeGroup;
    research?: boolean;
    followUp?: boolean;
    analytics?: boolean;
  } = {},
): ConsentRecord {
  const result = createConsentRecord({
    assessmentMode: options.mode ?? "quick",
    ageGroup: options.ageGroup ?? "age_18_or_above",
    operationalConsent: true,
    researchConsent: options.research ?? false,
    followUpContactConsent: options.followUp ?? false,
    analyticsConsent: options.analytics ?? false,
    participantSessionId: "c26baa32-bf64-4f10-bd2f-3f86409e147a",
    consentTimestamp: "2026-07-18T10:00:00.000Z",
  });
  assert(result.isValid && result.consent, "Test consent could not be created.");
  return result.consent;
}

const adultConsent = consent();

const tests: readonly { name: string; run: () => void }[] = [
  {
    name: "valid adult operational consent is accepted",
    run: () => assert(validateConsentRecord(adultConsent).isValid, "Adult consent was rejected."),
  },
  {
    name: "adult research consent may be granted",
    run: () => {
      const record = consent({ research: true });
      assert(record.researchConsent === "granted", "Research choice was not granted.");
      assert(record.researchStorageEligibility === "eligible", "Eligible adult was not marked eligible.");
    },
  },
  {
    name: "adult refusing research can still use the assessment",
    run: () => {
      assert(adultConsent.researchConsent === "declined", "Research refusal was not preserved.");
      assert(canAccessAssessmentWithConsent(serializeConsentSession(adultConsent), "quick"), "Research refusal blocked guidance.");
    },
  },
  {
    name: "operational consent false is rejected for assessment access",
    run: () => {
      const result = createConsentRecord({
        assessmentMode: "quick",
        ageGroup: "age_18_or_above",
        operationalConsent: false,
        researchConsent: false,
        followUpContactConsent: false,
        analyticsConsent: false,
      });
      assert(!result.isValid && hasError(result, "operational_consent_required"), "Operational refusal was accepted.");
    },
  },
  {
    name: "no checkbox defaults to true",
    run: () => assert(
      INITIAL_CONSENT_CHOICES.operationalConsent === false &&
        INITIAL_CONSENT_CHOICES.researchConsent === false &&
        INITIAL_CONSENT_CHOICES.followUpContactConsent === false &&
        INITIAL_CONSENT_CHOICES.analyticsConsent === false,
      "A checkbox defaulted to true.",
    ),
  },
  {
    name: "Quick mode is preserved",
    run: () => assert(adultConsent.assessmentMode === "quick", "Quick mode changed."),
  },
  {
    name: "Detailed mode is preserved",
    run: () => assert(consent({ mode: "detailed" }).assessmentMode === "detailed", "Detailed mode changed."),
  },
  {
    name: "unknown assessment mode is rejected",
    run: () => assert(hasError(validateConsentRecord({ ...adultConsent, assessmentMode: "full" }), "unknown_assessment_mode"), "Unknown mode was accepted."),
  },
  {
    name: "unknown age group is rejected",
    run: () => assert(hasError(validateConsentRecord({ ...adultConsent, ageGroup: "unknown" }), "unknown_age_group"), "Unknown age group was accepted."),
  },
  {
    name: "malformed payload is rejected safely",
    run: () => assert(parseConsentSessionPayload("not-json") === null, "Malformed JSON was accepted."),
  },
  {
    name: "schema-version mismatch is rejected",
    run: () => assert(hasError(validateConsentRecord({ ...adultConsent, schemaVersion: 2 }), "schema_version_mismatch"), "Unknown schema was accepted."),
  },
  {
    name: "invalid timestamp is rejected",
    run: () => assert(hasError(validateConsentRecord({ ...adultConsent, consentTimestamp: "18 July 2026" }), "invalid_timestamp"), "Invalid timestamp was accepted."),
  },
  {
    name: "privacy-policy version is preserved",
    run: () => assert(adultConsent.privacyPolicyVersion === PRIVACY_POLICY_VERSION, "Policy version changed."),
  },
  {
    name: "consent-text version is preserved",
    run: () => assert(adultConsent.consentTextVersion === CONSENT_TEXT_VERSION, "Consent version changed."),
  },
  {
    name: "follow-up consent is independent from research consent",
    run: () => {
      const record = consent({ followUp: true, research: false });
      assert(record.followUpContactConsent === "granted" && record.researchConsent === "declined", "Follow-up consent depended on research consent.");
    },
  },
  {
    name: "analytics consent is independent from research consent",
    run: () => {
      const record = consent({ analytics: true, research: false });
      assert(record.analyticsConsent === "granted" && record.researchConsent === "declined", "Analytics consent depended on research consent.");
    },
  },
  {
    name: "age 16-17 user can use educational guidance",
    run: () => {
      const record = consent({ ageGroup: "age_16_17" });
      assert(canAccessAssessmentWithConsent(serializeConsentSession(record), "quick"), "Age 16-17 was blocked from guidance.");
    },
  },
  {
    name: "age 16-17 user is not eligible for research storage",
    run: () => assert(consent({ ageGroup: "age_16_17", research: true }).researchStorageEligibility === "not_eligible_minor_process_required", "Age 16-17 became research eligible."),
  },
  {
    name: "under-16 user can use educational guidance",
    run: () => {
      const record = consent({ ageGroup: "under_16" });
      assert(canAccessAssessmentWithConsent(serializeConsentSession(record), "quick"), "Under-16 user was blocked from guidance.");
    },
  },
  {
    name: "under-16 user is not eligible for research storage",
    run: () => assert(consent({ ageGroup: "under_16", research: true }).researchStorageEligibility === "not_eligible_minor_process_required", "Under-16 user became research eligible."),
  },
  {
    name: "minor cannot receive research-storage eligibility true",
    run: () => {
      const minor = consent({ ageGroup: "age_16_17", research: true });
      const result = validateConsentRecord({ ...minor, researchStorageEligibility: "eligible" });
      assert(hasError(result, "minor_research_storage_not_allowed"), "Minor research eligibility was accepted.");
    },
  },
  {
    name: "guardian status is consistent with minor age",
    run: () => {
      assert(consent({ ageGroup: "age_16_17" }).guardianConsentStatus === "future_approved_process_required", "Age 16-17 guardian status is wrong.");
      assert(consent({ ageGroup: "under_16" }).guardianConsentStatus === "required_not_collected", "Under-16 guardian status is wrong.");
    },
  },
  {
    name: "adult guardian status is not_applicable",
    run: () => assert(adultConsent.guardianConsentStatus === "not_applicable", "Adult guardian status is wrong."),
  },
  {
    name: "participant ID is non-sequential and valid",
    run: () => {
      const created = createConsentRecord({
        assessmentMode: "quick",
        ageGroup: "age_18_or_above",
        operationalConsent: true,
        researchConsent: false,
        followUpContactConsent: false,
        analyticsConsent: false,
      });
      assert(created.consent && isValidAnonymousParticipantId(created.consent.participantSessionId), "Generated participant ID is invalid.");
      assert(!/^\d+$/.test(created.consent.participantSessionId), "Participant ID is sequential.");
    },
  },
  {
    name: "student name is absent from consent payload",
    run: () => assert(!("name" in adultConsent) && !serializeConsentSession(adultConsent).includes("studentName"), "Consent includes a student name."),
  },
  {
    name: "consent session key differs from assessment and feedback keys",
    run: () => {
      const otherKeys = [ASSESSMENT_MODE_SESSION_KEY, ASSESSMENT_DRAFT_SESSION_KEY, RECOMMENDATION_SESSION_KEY, ASSESSMENT_FEEDBACK_SESSION_KEY];
      assert(otherKeys.every((key) => String(key) !== String(CONSENT_SESSION_KEY)), "Consent key overlaps another session key.");
    },
  },
  {
    name: "serialization and parsing preserve valid consent",
    run: () => {
      const parsed = parseConsentSessionPayload(serializeConsentSession(adultConsent));
      assert(JSON.stringify(parsed?.consent) === JSON.stringify(adultConsent), "Consent changed after round-trip.");
    },
  },
  {
    name: "invalid operational-consent access is blocked",
    run: () => {
      const invalid = JSON.stringify({ schemaVersion: 1, consent: { ...adultConsent, operationalConsent: false, researchStorageEligibility: "not_eligible_invalid_consent" } });
      assert(!canAccessAssessmentWithConsent(invalid, "quick"), "Invalid operational access was allowed.");
    },
  },
  {
    name: "valid legacy Version 1 session compatibility remains safe",
    run: () => assert(resolveConsentAccess(null, "quick", true) === "allowed", "Legacy Version 1 access was blocked."),
  },
  {
    name: "consent processing does not mutate recommendation results",
    run: () => {
      const result = { recommendations: [{ programId: "SIBAU-BSCS", rank: 1, finalScore: 82 }] };
      const before = JSON.stringify(result);
      createConsentRecord({ assessmentMode: "quick", ageGroup: "age_18_or_above", operationalConsent: true, researchConsent: true, followUpContactConsent: false, analyticsConsent: false });
      assert(JSON.stringify(result) === before, "Recommendation result was mutated.");
    },
  },
  {
    name: "unknown consent fields are rejected",
    run: () => assert(hasError(validateConsentRecord({ ...adultConsent, email: "student@example.com" }), "unknown_field"), "Unknown personal-data field was accepted."),
  },
  {
    name: "research eligibility derivation handles invalid operational consent",
    run: () => assert(deriveResearchStorageEligibility("age_18_or_above", false, "granted") === "not_eligible_invalid_consent", "Invalid operational consent became research eligible."),
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${passed}. ${test.name}`);
}
console.log(`Consent tests passed: ${passed}/${tests.length}.`);
