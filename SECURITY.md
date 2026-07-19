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
- Connect any database to user flows only after approved privacy, security, ethics, and operational review.

## Current browser-storage architecture

The current Version 2 UI performs no permanent applicant or research writes. It uses separate versioned `sessionStorage` records for assessment mode, consent, assessment drafts, recommendation results, optional feedback, and dismissal of the essential-storage notice. A Supabase schema and disabled API foundation now exist, but no browser flow calls the API.

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

The prepared write path calls the central governance and participant-eligibility gate on the server immediately before storage, validates and recalculates submitted data, and fails closed. It does not rely on the legacy consent record's preliminary `researchStorageEligibility` field by itself. Missing governance or Supabase configuration returns a safe unavailable response.

## Supabase server boundary

- `SUPABASE_SERVICE_ROLE_KEY` is read only by `src/lib/supabase/server.ts`, which is marked `server-only` and imported only by the POST route.
- The service role bypasses Row Level Security. Its power is intentionally limited by the API validator and the single transactional database function; accidental exposure would be a critical incident requiring immediate key rotation.
- All 11 research tables have RLS enabled. There are no anonymous or authenticated public policies, no public reads, and no direct browser writes.
- The route accepts JSON only, enforces a byte limit, uses generic error responses, and does not log request bodies, marks, raw answers, comments, contacts, or credentials.
- Database credentials cannot enable collection. Governance, participant eligibility, consent, payload validation, and server-side derived-value verification must also pass.
- Submission UUID uniqueness is enforced by database constraints. The database function performs all inserts atomically so validation or constraint failure leaves no partial assessment.
- `participant_contacts` is separate, expects encrypted values, and is not written by the application in this stage.

The schema excludes student names by default. It stores raw research responses and derived scores with explicit instrument, questionnaire, scoring-model, and program-data versions. Ethics and legal approval remain external requirements; administrative configuration does not prove either.

## Local synthetic integration testing

The optional `test:research-api-local` harness is a development control, not permission to collect research data. It accepts only `localhost` or `127.0.0.1` application and Supabase hostnames, refuses `NODE_ENV=production`, and requires the exact `LOCAL_SYNTHETIC_RESEARCH_TEST_ENABLED=true` flag in addition to the unchanged API governance gate. The flag defaults to false and is not read by the API route.

Fixtures are adult-only, anonymous, generated at runtime from the real question banks and scoring pipeline, and contain no names or contact fields. The harness uses the public POST boundary for writes; its local service-role credential is used only to count rows belonging to the generated IDs. It never calls the transactional function directly, never deletes unrelated data, and never logs credentials, raw payloads, or participant data. Synthetic local rows may remain until the developer intentionally resets the local Docker database.

Never point this harness at a hosted or production service, add real participant responses to fixtures, commit `.env.local`, or treat a passing local test as ethics, legal, privacy, or production authorization. Restore the research-collection and synthetic-test flags to false after each live run.

## Scope status

No released versions are currently supported. This policy will be expanded before public deployment to cover dependency updates, access control, data retention, backups, incident response, and responsible disclosure timelines.
