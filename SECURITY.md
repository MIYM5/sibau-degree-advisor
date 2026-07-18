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

## Scope status

No released versions are currently supported. This policy will be expanded before public deployment to cover dependency updates, access control, data retention, backups, incident response, and responsible disclosure timelines.
