import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  determineResearchParticipantEligibility,
  isOperationalGuidanceAvailable,
  toPublicResearchGovernanceStatus,
  validateResearchGovernanceConfig,
} from "../src/lib/research-governance";

type Environment = Readonly<Record<string, string | undefined>>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const adultEnvironment: Environment = {
  RESEARCH_DATA_COLLECTION_ENABLED: "true",
  RESEARCH_ETHICS_APPROVAL_REFERENCE: "ETHICS-2026-001",
  RESEARCH_ETHICS_COMMITTEE_NAME: "Example Ethics Committee",
  RESEARCH_RESPONSIBLE_RESEARCHER: "Example Researcher",
  RESEARCH_CONTACT_EMAIL: "research@example.org",
  PRIVACY_CONTACT_EMAIL: "privacy@example.org",
  RESEARCH_RETENTION_YEARS: "3",
  RESEARCH_WITHDRAWAL_URL: "https://example.org/research/withdraw",
  MINOR_RESEARCH_PROCESS_APPROVED: "false",
};

const minorEnvironment: Environment = {
  ...adultEnvironment,
  MINOR_RESEARCH_PROCESS_APPROVED: "true",
  RESEARCH_GUARDIAN_CONSENT_PROCEDURE_REFERENCE: "GUARDIAN-2026-001",
  RESEARCH_MINOR_ASSENT_PROCEDURE_REFERENCE: "ASSENT-2026-001",
};

function without(environment: Environment, key: string): Environment {
  return Object.fromEntries(
    Object.entries(environment).filter(([entryKey]) => entryKey !== key),
  );
}

function hasIssue(environment: Environment, code: string): boolean {
  return validateResearchGovernanceConfig(environment).issues.some(
    (item) => item.code === code,
  );
}

const tests: readonly { name: string; run: () => void }[] = [
  {
    name: "missing configuration defaults to guidance only",
    run: () => assert(validateResearchGovernanceConfig({}).status === "guidance_only", "Missing configuration enabled research."),
  },
  {
    name: "explicit false defaults to guidance only",
    run: () => assert(validateResearchGovernanceConfig({ RESEARCH_DATA_COLLECTION_ENABLED: "false" }).status === "guidance_only", "False collection flag enabled research."),
  },
  {
    name: "malformed collection boolean is rejected",
    run: () => assert(hasIssue({ RESEARCH_DATA_COLLECTION_ENABLED: "TRUE" }, "malformed_collection_boolean"), "Malformed collection flag was accepted."),
  },
  {
    name: "valid adult configuration is adult ready",
    run: () => assert(validateResearchGovernanceConfig(adultEnvironment).status === "adult_research_ready", "Valid adult configuration was rejected."),
  },
  {
    name: "missing ethics reference disables research",
    run: () => assert(validateResearchGovernanceConfig(without(adultEnvironment, "RESEARCH_ETHICS_APPROVAL_REFERENCE")).status === "guidance_only", "Missing ethics reference was accepted."),
  },
  {
    name: "missing committee disables research",
    run: () => assert(hasIssue(without(adultEnvironment, "RESEARCH_ETHICS_COMMITTEE_NAME"), "missing_ethics_committee"), "Missing committee was accepted."),
  },
  {
    name: "missing researcher disables research",
    run: () => assert(hasIssue(without(adultEnvironment, "RESEARCH_RESPONSIBLE_RESEARCHER"), "missing_responsible_researcher"), "Missing researcher was accepted."),
  },
  {
    name: "missing research contact disables research",
    run: () => assert(hasIssue(without(adultEnvironment, "RESEARCH_CONTACT_EMAIL"), "missing_research_contact"), "Missing research contact was accepted."),
  },
  {
    name: "invalid research email disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, RESEARCH_CONTACT_EMAIL: "invalid" }).status === "guidance_only", "Invalid research email was accepted."),
  },
  {
    name: "missing privacy email disables research",
    run: () => assert(hasIssue(without(adultEnvironment, "PRIVACY_CONTACT_EMAIL"), "missing_privacy_contact"), "Missing privacy email was accepted."),
  },
  {
    name: "invalid privacy email disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, PRIVACY_CONTACT_EMAIL: "invalid" }).status === "guidance_only", "Invalid privacy email was accepted."),
  },
  {
    name: "zero retention disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, RESEARCH_RETENTION_YEARS: "0" }).status === "guidance_only", "Zero retention was accepted."),
  },
  {
    name: "negative retention disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, RESEARCH_RETENTION_YEARS: "-2" }).status === "guidance_only", "Negative retention was accepted."),
  },
  {
    name: "fractional retention disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, RESEARCH_RETENTION_YEARS: "1.5" }).status === "guidance_only", "Fractional retention was accepted."),
  },
  {
    name: "invalid withdrawal URL disables research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, RESEARCH_WITHDRAWAL_URL: "not-a-url" }).status === "guidance_only", "Invalid withdrawal URL was accepted."),
  },
  {
    name: "minor process cannot be enabled independently",
    run: () => assert(hasIssue({ MINOR_RESEARCH_PROCESS_APPROVED: "true" }, "minor_enabled_without_adult_collection"), "Independent minor flag was accepted."),
  },
  {
    name: "malformed minor boolean disables adult research",
    run: () => assert(validateResearchGovernanceConfig({ ...adultEnvironment, MINOR_RESEARCH_PROCESS_APPROVED: "yes" }).status === "guidance_only", "Malformed minor flag did not fail closed."),
  },
  {
    name: "missing guardian procedure prevents minor readiness",
    run: () => assert(validateResearchGovernanceConfig(without(minorEnvironment, "RESEARCH_GUARDIAN_CONSENT_PROCEDURE_REFERENCE")).status === "adult_research_ready", "Missing guardian procedure did not restrict minors."),
  },
  {
    name: "missing assent procedure prevents minor readiness",
    run: () => assert(validateResearchGovernanceConfig(without(minorEnvironment, "RESEARCH_MINOR_ASSENT_PROCEDURE_REFERENCE")).status === "adult_research_ready", "Missing assent procedure did not restrict minors."),
  },
  {
    name: "complete minor configuration is minor ready",
    run: () => assert(validateResearchGovernanceConfig(minorEnvironment).status === "minor_research_ready", "Complete minor configuration was rejected."),
  },
  {
    name: "adult consent is guidance only while governance is disabled",
    run: () => assert(determineResearchParticipantEligibility({ ageGroup: "age_18_or_above", operationalConsent: true, researchConsent: "granted" }, validateResearchGovernanceConfig({})) === "guidance_only", "Disabled governance marked an adult eligible."),
  },
  {
    name: "adult consent is eligible when adult governance is ready",
    run: () => assert(determineResearchParticipantEligibility({ ageGroup: "age_18_or_above", operationalConsent: true, researchConsent: "granted" }, validateResearchGovernanceConfig(adultEnvironment)) === "eligible_adult_with_consent", "Ready adult was not eligible."),
  },
  {
    name: "adult research refusal stays ineligible",
    run: () => assert(determineResearchParticipantEligibility({ ageGroup: "age_18_or_above", operationalConsent: true, researchConsent: "declined" }, validateResearchGovernanceConfig(adultEnvironment)) === "ineligible_no_research_consent", "Adult refusal was treated as eligible."),
  },
  {
    name: "minor stays ineligible under adult-only governance",
    run: () => assert(determineResearchParticipantEligibility({ ageGroup: "age_16_17", operationalConsent: true, researchConsent: "granted" }, validateResearchGovernanceConfig(adultEnvironment)) === "ineligible_minor_process_not_approved", "Adult readiness enabled minor storage."),
  },
  {
    name: "minor-ready configuration is necessary but participant procedure evidence is still required",
    run: () => assert(determineResearchParticipantEligibility({ ageGroup: "age_16_17", operationalConsent: true, researchConsent: "granted" }, validateResearchGovernanceConfig(minorEnvironment)) === "guidance_only", "Configuration alone marked a minor storage eligible."),
  },
  {
    name: "operational guidance remains available in guidance-only status",
    run: () => assert(isOperationalGuidanceAvailable(true, "guidance_only"), "Guidance was blocked."),
  },
  {
    name: "operational guidance remains available in adult-ready status",
    run: () => assert(isOperationalGuidanceAvailable(true, "adult_research_ready"), "Adult-ready status blocked guidance."),
  },
  {
    name: "operational guidance remains available in minor-ready status",
    run: () => assert(isOperationalGuidanceAvailable(true, "minor_research_ready"), "Minor-ready status blocked guidance."),
  },
  {
    name: "public status excludes procedure references and raw configuration",
    run: () => {
      const publicStatus = toPublicResearchGovernanceStatus(validateResearchGovernanceConfig(minorEnvironment));
      assert(!("guardianConsentProcedureReference" in publicStatus), "Guardian procedure reference was exposed.");
      assert(!("minorAssentProcedureReference" in publicStatus), "Assent procedure reference was exposed.");
      assert(!("config" in publicStatus) && !("issues" in publicStatus), "Internal governance details were exposed.");
    },
  },
  {
    name: "default environment example keeps both gates disabled",
    run: () => {
      const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");
      assert(example.includes("RESEARCH_DATA_COLLECTION_ENABLED=false"), "Adult gate is not disabled by default.");
      assert(example.includes("MINOR_RESEARCH_PROCESS_APPROVED=false"), "Minor gate is not disabled by default.");
    },
  },
  {
    name: "no permanent storage operation is introduced by governance modules",
    run: () => {
      const source = readFileSync(resolve(process.cwd(), "src/lib/research-governance.ts"), "utf8");
      assert(!/\b(insert|upsert|database|supabase|fetch)\s*\(/i.test(source), "A storage or network operation appeared in governance code.");
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`\n${tests.length} research-governance tests passed.`);
