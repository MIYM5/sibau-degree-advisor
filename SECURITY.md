# Security Policy

SIBAU Degree Advisor is not yet a deployed application. Security reports are still welcome because the repository may later handle student-provided academic and preference information.

## Reporting a vulnerability

Do not open a public issue containing a vulnerability, secret, or personal data. Once the GitHub repository is connected, use GitHub's private vulnerability reporting feature if it is enabled. Until then, contact the project owner through a private channel already known to you.

Include a clear description, steps to reproduce, possible impact, and a suggested mitigation if available. Do not include real student records in a report.

## Data-safety principles

- Collect only the information needed to produce a recommendation.
- Do not store real student data during early local development.
- Never commit `.env` files, credentials, access tokens, or production data.
- Treat marks, interests, aptitude responses, and contact details as sensitive user data.
- Do not log complete student profiles in production.
- Keep eligibility sources auditable without storing applicant identity information.
- Add authentication and a database only after an approved privacy and security design.

## Current browser-storage architecture

The current Version 2 application has no permanent applicant or research database. It uses separate versioned `sessionStorage` records for assessment mode, consent, assessment drafts, recommendation results, optional feedback, and dismissal of the essential-storage notice.

- `sessionStorage` is temporary and scoped to the current browser tab; closing the tab may clear it.
- Every structured record is validated at runtime before use.
- Operational consent is required for new Version 2 assessment processing.
- Research, follow-up contact, and future analytics choices are optional and independent.
- No advertising cookies, analytics, trackers, advertising pixels, or session-recording tools are loaded.
- Consent records exclude names, contact information, CNIC, marks, assessment answers, and recommendation results.
- Client-side validation and browser storage are not security boundaries. Someone with access to the same device and open tab may be able to inspect session data.

Minor assessment data is not eligible for research storage until a separately approved process covers guardian permission, participant assent, institutional ethics review, safeguarding, withdrawal, and data governance. This repository does not collect guardian names or CNIC numbers.

Before permanent research collection, the project must complete legal and institutional ethics review, identify the responsible operator and contacts, define lawful purpose, retention, access, deletion, withdrawal, breach response, sharing, de-identification limits, and protections for minors. Current consent metadata must not be treated as permission to begin database collection.

## Research-governance safety gate

Research collection defaults to disabled in local development, tests, and production when configuration is absent, false, incomplete, inconsistent, or malformed. The server-only validator reports `guidance_only`, `adult_research_ready`, or `minor_research_ready`; it performs no network or storage operation. Only a safe subset of non-secret administrative metadata is rendered publicly.

Adult readiness requires the exact collection flag plus configured ethics reference, committee, responsible researcher, research and privacy contacts, positive retention period, and withdrawal URL. Minor readiness additionally requires the exact minor-approval flag and references for approved guardian-consent and minor-assent procedures. Consent and configuration are independent controls: neither is sufficient alone. Configuration records an administrator assertion and must not be treated as evidence that approval is authentic or a participant procedure was completed.

Any future database write path must call the central governance and participant-eligibility gate on the server immediately before storage, validate submitted data again, and fail closed. It must not rely on the legacy consent record's preliminary `researchStorageEligibility` field by itself. No database, permanent storage, analytics, cookies, or tracking was introduced with this gate.

## Scope status

No released versions are currently supported. This policy will be expanded before public deployment to cover dependency updates, access control, data retention, backups, incident response, and responsible disclosure timelines.
