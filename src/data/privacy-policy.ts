export const PRIVACY_POLICY_VERSION = "privacy-v1.0" as const;
export const CONSENT_TEXT_VERSION = "consent-v1.0" as const;
export const PRIVACY_POLICY_LAST_UPDATED = "2026-07-18" as const;

export const OPERATIONAL_CONSENT_TEXT =
  "I have read the Privacy and Research Data Notice and agree to the processing of my assessment information required to generate educational degree guidance and recommendations.";

export const RESEARCH_CONSENT_TEXT =
  "I voluntarily agree that my de-identified assessment responses, recommendation results, and feedback may be stored and used for academic research, reports, presentations, and publications.";

export const FOLLOW_UP_CONSENT_TEXT =
  "I agree to be contacted for an optional follow-up study.";

export const ANALYTICS_CONSENT_TEXT =
  "I agree to optional analytics in a future separately approved version. No analytics, advertising cookies, or tracking tools are currently loaded.";

export const ESSENTIAL_STORAGE_NOTICE_TEXT =
  "This site uses essential browser session storage to preserve your selected assessment mode, progress, results, consent choices, and optional feedback within the current browser tab. No advertising cookies or tracking tools are currently used.";

export interface PrivacyPolicySection {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export const privacyPolicySections: readonly PrivacyPolicySection[] = [
  {
    id: "operator",
    title: "1. Who operates the service",
    paragraphs: [
      "SIBAU Degree Advisor is currently operated as an independent educational software project. The final responsible institution, research lead, data controller, and formal contact details have not yet been confirmed.",
    ],
  },
  {
    id: "independent-project",
    title: "2. Independent project and admission disclaimer",
    paragraphs: [
      "This project is not an official Sukkur IBA University admissions system and does not claim university endorsement. Its recommendations provide educational guidance only and do not guarantee eligibility, selection, admission, academic success, or career outcomes.",
      "Students must confirm admission requirements through the current official Sukkur IBA University admission advertisement and admissions process.",
    ],
  },
  {
    id: "processing-purpose",
    title: "3. Purpose of data processing",
    paragraphs: [
      "The current application processes assessment information to check stored eligibility rules, estimate academic and interest suitability, produce ranked educational guidance, explain the result, and preserve progress within the current browser tab.",
    ],
  },
  {
    id: "current-information",
    title: "4. Information currently processed",
    paragraphs: [
      "The current tab may process a display name, Intermediate group, subject marks, interest responses, brief aptitude responses, assessment mode, generated recommendations, consent choices, age group, and optional post-results feedback.",
    ],
    bullets: [
      "The consent record does not include the student name, contact information, marks, assessment responses, or recommendations.",
      "The application does not ask for CNIC numbers, addresses, health information, religion, political information, or precise location.",
    ],
  },
  {
    id: "future-research",
    title: "5. Optional future research use",
    paragraphs: [
      "A later, separately approved project stage may propose storing de-identified assessment responses, recommendation results, and feedback for academic research, reports, presentations, or publications. No applicant assessment data is permanently stored for research in the current version.",
      "The research-consent checkbox records future-ready metadata only. It does not send data to a database and does not mean that research collection has begun or received ethics approval.",
    ],
  },
  {
    id: "voluntary-research",
    title: "6. Voluntary research participation",
    paragraphs: [
      "Research participation is optional. Refusing or withdrawing optional research consent must not block educational guidance or change current recommendations. Operational consent is separate and covers only the processing required to run the assessment in the current tab.",
    ],
  },
  {
    id: "minors",
    title: "7. Minors and guardian consent",
    paragraphs: [
      "Students under 18 may use the current educational guidance flow, but their records are not eligible for future research storage under this version. A minor's checkbox alone is not treated as sufficient research consent.",
      "Before any minor-participant research begins, an approved procedure must define guardian permission, participant assent, institutional approval, safeguarding, withdrawal, and age-appropriate information. No guardian identity or CNIC is collected now.",
    ],
  },
  {
    id: "automated-recommendations",
    title: "8. Automated recommendation explanation",
    paragraphs: [
      "Recommendations are produced by local rules and transparent model assumptions. Eligibility is checked separately before eligible programs are ranked using academic, RIASEC-interest, and brief-aptitude evidence. Model weights and confidence thresholds are not official university admission weightages or validated psychometric standards.",
    ],
  },
  {
    id: "sharing",
    title: "9. Data sharing",
    paragraphs: [
      "No applicant assessment data is currently transferred to a project database or sold. Personal data will not be sold. Any future research sharing, publication, or third-party processing requires a separately reviewed purpose, safeguards, consent wording, and disclosure in an updated notice.",
    ],
  },
  {
    id: "security",
    title: "10. Data security limitations",
    paragraphs: [
      "The current browser-only design reduces server-side collection but cannot guarantee anonymity or absolute security. Someone with access to the same device and open browser tab may be able to view session data. Client-side validation is not a security boundary.",
    ],
  },
  {
    id: "session-storage",
    title: "11. SessionStorage and essential browser storage",
    paragraphs: [
      "The application uses essential sessionStorage to preserve the selected mode, assessment progress, results, consent choices, optional feedback, and dismissal of the storage notice in the current browser tab. These records use separate versioned keys and are validated before use.",
      "sessionStorage is temporary and tab-scoped. Closing the tab may clear it. Browser behavior, privacy settings, or manual clearing can also remove it. It is not permanent research storage.",
    ],
  },
  {
    id: "cookies-analytics",
    title: "12. Cookies and analytics",
    paragraphs: [
      "No advertising cookies, Google Analytics, Meta Pixel, session-recording tools, behavioral trackers, or advertising technology are currently used. The optional analytics choice is future-ready metadata only and does not load analytics.",
    ],
  },
  {
    id: "retention",
    title: "13. Data retention placeholder",
    paragraphs: [
      "Current assessment data is retained only in temporary tab-scoped sessionStorage and may disappear when the tab closes. Permanent research retention periods have not been approved or defined. They must be documented before any persistent collection begins.",
    ],
  },
  {
    id: "rights",
    title: "14. Access, correction, deletion, and withdrawal placeholder",
    paragraphs: [
      "The current version has no accounts or server database. Students can edit assessment answers before or after viewing results, retake the assessment, clear site data, or close the tab. A future persistent system must provide reviewed procedures for access, correction, deletion, research withdrawal, and the limits of withdrawal after de-identification or publication.",
    ],
  },
  {
    id: "contact-ethics",
    title: "15. Contact and ethics-approval placeholders",
    paragraphs: [
      "Project contact, privacy contact, research-lead details, ethics-committee details, complaint routes, and jurisdiction-specific legal information are not yet finalized. They must be added before public research recruitment or permanent collection.",
      "This notice does not claim legal approval, ethics approval, institutional endorsement, or authority from Sukkur IBA University. A separate institutional ethics and legal review remains required.",
    ],
  },
  {
    id: "version",
    title: "16. Policy version and last updated",
    paragraphs: [
      `Policy version: ${PRIVACY_POLICY_VERSION}. Consent text version: ${CONSENT_TEXT_VERSION}. Last updated: ${PRIVACY_POLICY_LAST_UPDATED}. Material changes require a new version and renewed consent where appropriate.`,
    ],
  },
];
