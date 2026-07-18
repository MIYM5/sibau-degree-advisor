import type { AgeGroup, ConsentChoice } from "./consent";

export type ResearchCollectionStatus =
  | "guidance_only"
  | "adult_research_ready"
  | "minor_research_ready";

export type ResearchParticipantEligibility =
  | "guidance_only"
  | "eligible_adult_with_consent"
  | "ineligible_no_research_consent"
  | "ineligible_minor_process_not_approved"
  | "ineligible_invalid_governance_configuration";

export interface ResearchGovernanceConfig {
  researchDataCollectionEnabled: boolean;
  ethicsApprovalReference: string | null;
  ethicsCommitteeName: string | null;
  responsibleResearcher: string | null;
  researchContactEmail: string | null;
  privacyContactEmail: string | null;
  retentionYears: number | null;
  withdrawalUrl: string | null;
  minorResearchProcessApproved: boolean;
  guardianConsentProcedureReference: string | null;
  minorAssentProcedureReference: string | null;
}

export interface ResearchGovernanceIssue {
  code: string;
  field: keyof ResearchGovernanceConfig | "configuration";
  message: string;
  severity: "warning" | "error";
}

export interface ResearchGovernanceValidationResult {
  status: ResearchCollectionStatus;
  config: ResearchGovernanceConfig;
  issues: ResearchGovernanceIssue[];
  adultConfigurationValid: boolean;
  minorConfigurationValid: boolean;
}

export interface ResearchParticipantContext {
  ageGroup: AgeGroup;
  operationalConsent: boolean;
  researchConsent: ConsentChoice;
}
