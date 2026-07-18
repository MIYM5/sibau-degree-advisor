import type {
  ResearchCollectionStatus,
  ResearchGovernanceConfig,
  ResearchGovernanceIssue,
  ResearchGovernanceValidationResult,
  ResearchParticipantContext,
  ResearchParticipantEligibility,
} from "../types/research-governance";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function configured(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseBoolean(
  value: string | undefined,
): { value: boolean; malformed: boolean } {
  if (value === undefined || value === "" || value === "false") {
    return { value: false, malformed: false };
  }
  if (value === "true") return { value: true, malformed: false };
  return { value: false, malformed: true };
}

function parseRetentionYears(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validHttpUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function issue(
  field: ResearchGovernanceIssue["field"],
  code: string,
  message: string,
  severity: ResearchGovernanceIssue["severity"] = "error",
): ResearchGovernanceIssue {
  return { field, code, message, severity };
}

export function validateResearchGovernanceConfig(
  environment: EnvironmentSource,
): ResearchGovernanceValidationResult {
  const collectionFlag = parseBoolean(
    environment.RESEARCH_DATA_COLLECTION_ENABLED,
  );
  const minorFlag = parseBoolean(environment.MINOR_RESEARCH_PROCESS_APPROVED);
  const config: ResearchGovernanceConfig = {
    researchDataCollectionEnabled: collectionFlag.value,
    ethicsApprovalReference: configured(
      environment.RESEARCH_ETHICS_APPROVAL_REFERENCE,
    ),
    ethicsCommitteeName: configured(
      environment.RESEARCH_ETHICS_COMMITTEE_NAME,
    ),
    responsibleResearcher: configured(
      environment.RESEARCH_RESPONSIBLE_RESEARCHER,
    ),
    researchContactEmail: configured(environment.RESEARCH_CONTACT_EMAIL),
    privacyContactEmail: configured(environment.PRIVACY_CONTACT_EMAIL),
    retentionYears: parseRetentionYears(environment.RESEARCH_RETENTION_YEARS),
    withdrawalUrl: configured(environment.RESEARCH_WITHDRAWAL_URL),
    minorResearchProcessApproved: minorFlag.value,
    guardianConsentProcedureReference: configured(
      environment.RESEARCH_GUARDIAN_CONSENT_PROCEDURE_REFERENCE,
    ),
    minorAssentProcedureReference: configured(
      environment.RESEARCH_MINOR_ASSENT_PROCEDURE_REFERENCE,
    ),
  };
  const issues: ResearchGovernanceIssue[] = [];

  if (collectionFlag.malformed) {
    issues.push(
      issue(
        "researchDataCollectionEnabled",
        "malformed_collection_boolean",
        "RESEARCH_DATA_COLLECTION_ENABLED must be exactly true or false.",
      ),
    );
  }
  if (minorFlag.malformed) {
    issues.push(
      issue(
        "minorResearchProcessApproved",
        "malformed_minor_boolean",
        "MINOR_RESEARCH_PROCESS_APPROVED must be exactly true or false.",
      ),
    );
  }
  if (
    config.minorResearchProcessApproved &&
    !config.researchDataCollectionEnabled
  ) {
    issues.push(
      issue(
        "minorResearchProcessApproved",
        "minor_enabled_without_adult_collection",
        "Minor research readiness cannot be enabled while adult collection is disabled.",
      ),
    );
  }

  if (!config.researchDataCollectionEnabled) {
    if (!collectionFlag.malformed && !minorFlag.malformed && issues.length === 0) {
      issues.push(
        issue(
          "researchDataCollectionEnabled",
          "research_collection_disabled",
          "Research collection is disabled; educational guidance remains available.",
          "warning",
        ),
      );
    }
    return {
      status: "guidance_only",
      config,
      issues,
      adultConfigurationValid: false,
      minorConfigurationValid: false,
    };
  }

  const requiredAdultFields: readonly [
    keyof ResearchGovernanceConfig,
    string | number | null,
    string,
    string,
  ][] = [
    [
      "ethicsApprovalReference",
      config.ethicsApprovalReference,
      "missing_ethics_reference",
      "An ethics approval reference is required.",
    ],
    [
      "ethicsCommitteeName",
      config.ethicsCommitteeName,
      "missing_ethics_committee",
      "An ethics committee name is required.",
    ],
    [
      "responsibleResearcher",
      config.responsibleResearcher,
      "missing_responsible_researcher",
      "A responsible researcher is required.",
    ],
    [
      "researchContactEmail",
      config.researchContactEmail,
      "missing_research_contact",
      "A valid research contact email is required.",
    ],
    [
      "privacyContactEmail",
      config.privacyContactEmail,
      "missing_privacy_contact",
      "A valid privacy contact email is required.",
    ],
    [
      "retentionYears",
      config.retentionYears,
      "invalid_retention_period",
      "A positive whole-number retention period is required.",
    ],
    [
      "withdrawalUrl",
      config.withdrawalUrl,
      "invalid_withdrawal_url",
      "A valid HTTP or HTTPS withdrawal URL is required.",
    ],
  ];

  for (const [field, value, code, message] of requiredAdultFields) {
    if (value === null) issues.push(issue(field, code, message));
  }
  if (
    config.researchContactEmail &&
    !EMAIL_PATTERN.test(config.researchContactEmail)
  ) {
    issues.push(
      issue(
        "researchContactEmail",
        "invalid_research_contact_email",
        "Research contact email is invalid.",
      ),
    );
  }
  if (
    config.privacyContactEmail &&
    !EMAIL_PATTERN.test(config.privacyContactEmail)
  ) {
    issues.push(
      issue(
        "privacyContactEmail",
        "invalid_privacy_contact_email",
        "Privacy contact email is invalid.",
      ),
    );
  }
  if (config.withdrawalUrl && !validHttpUrl(config.withdrawalUrl)) {
    issues.push(
      issue(
        "withdrawalUrl",
        "invalid_withdrawal_url",
        "Withdrawal URL must use HTTP or HTTPS.",
      ),
    );
  }

  const adultConfigurationValid = !issues.some(
    (item) => item.severity === "error",
  );
  if (!adultConfigurationValid) {
    return {
      status: "guidance_only",
      config,
      issues,
      adultConfigurationValid: false,
      minorConfigurationValid: false,
    };
  }

  if (!config.minorResearchProcessApproved) {
    return {
      status: "adult_research_ready",
      config,
      issues,
      adultConfigurationValid: true,
      minorConfigurationValid: false,
    };
  }

  if (!config.guardianConsentProcedureReference) {
    issues.push(
      issue(
        "guardianConsentProcedureReference",
        "missing_guardian_procedure",
        "An approved guardian-consent procedure reference is required for minors.",
      ),
    );
  }
  if (!config.minorAssentProcedureReference) {
    issues.push(
      issue(
        "minorAssentProcedureReference",
        "missing_minor_assent_procedure",
        "An approved minor-assent procedure reference is required for minors.",
      ),
    );
  }
  const minorConfigurationValid = !issues.some(
    (item) => item.severity === "error",
  );
  return {
    status: minorConfigurationValid
      ? "minor_research_ready"
      : "adult_research_ready",
    config,
    issues,
    adultConfigurationValid: true,
    minorConfigurationValid,
  };
}

export function getResearchGovernanceStatus(
  environment: EnvironmentSource = process.env,
): ResearchGovernanceValidationResult {
  return validateResearchGovernanceConfig(environment);
}

export function determineResearchParticipantEligibility(
  participant: ResearchParticipantContext,
  governance: ResearchGovernanceValidationResult,
): ResearchParticipantEligibility {
  if (!participant.operationalConsent) {
    return "ineligible_invalid_governance_configuration";
  }
  if (governance.status === "guidance_only") {
    return governance.issues.some((item) => item.severity === "error")
      ? "ineligible_invalid_governance_configuration"
      : "guidance_only";
  }
  if (participant.researchConsent !== "granted") {
    return "ineligible_no_research_consent";
  }
  if (participant.ageGroup === "age_18_or_above") {
    return "eligible_adult_with_consent";
  }
  if (governance.status !== "minor_research_ready") {
    return "ineligible_minor_process_not_approved";
  }

  // The configured system may be ready for an approved minor procedure, but
  // this application does not collect proof that the procedure was completed.
  return "guidance_only";
}

export function isOperationalGuidanceAvailable(
  operationalConsent: boolean,
  status: ResearchCollectionStatus,
): boolean {
  switch (status) {
    case "guidance_only":
    case "adult_research_ready":
    case "minor_research_ready":
      return operationalConsent;
  }
}

export interface PublicResearchGovernanceStatus {
  status: ResearchCollectionStatus;
  responsibleResearcher: string | null;
  ethicsCommitteeName: string | null;
  ethicsApprovalReference: string | null;
  researchContactEmail: string | null;
  privacyContactEmail: string | null;
  retentionYears: number | null;
  withdrawalUrl: string | null;
  minorResearchProcessApproved: boolean;
}

export function toPublicResearchGovernanceStatus(
  result: ResearchGovernanceValidationResult,
): PublicResearchGovernanceStatus {
  return {
    status: result.status,
    responsibleResearcher: result.config.responsibleResearcher,
    ethicsCommitteeName: result.config.ethicsCommitteeName,
    ethicsApprovalReference: result.config.ethicsApprovalReference,
    researchContactEmail: result.config.researchContactEmail,
    privacyContactEmail: result.config.privacyContactEmail,
    retentionYears: result.config.retentionYears,
    withdrawalUrl: result.config.withdrawalUrl,
    minorResearchProcessApproved:
      result.status === "minor_research_ready" &&
      result.minorConfigurationValid,
  };
}
