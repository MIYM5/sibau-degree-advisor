# Roadmap

This roadmap keeps SIBAU Degree Advisor small enough for a first full web application while protecting the accuracy of eligibility guidance. Dates are intentionally not promised yet.

## Phase 0 — Documentation foundation

Status: **In progress**

- Establish product, eligibility, scoring, architecture, data, security, and contribution documents.
- Preserve and inspect the Excel knowledge base.
- Record open eligibility conflicts and verification needs.
- Approve the foundation before initializing Next.js.

Exit condition: the project owner reviews the documentation and approves framework initialization.

## Phase 1 — Application skeleton

- Initialize Next.js with TypeScript, Tailwind CSS, App Router, and npm.
- Add basic page layout, navigation, typography, and accessibility baseline.
- Add linting, formatting, type checking, and a test strategy with minimal dependencies.
- Keep the application local and static; do not add a database or authentication.

Exit condition: a clean starter application runs locally and automated checks pass.

## Phase 2 — Knowledge-base import and validation

- Define TypeScript types and validation rules for programs, evidence, eligibility, and weights.
- Create a repeatable conversion process from the Excel workbook to an application-friendly data file.
- Preserve official source URLs and last-verified dates.
- Validate unique IDs, required fields, weight totals, dates, and eligibility classifications.
- Document any workbook-to-application mapping decisions.

Exit condition: all current workbook programs load deterministically without changing the source workbook.

## Phase 3 — Eligibility engine

- Implement pure, testable eligibility functions.
- Add Eligible, Not eligible, and Verification required states.
- Implement the exact working Pre-Medical rule.
- Implement separate restricted rules for both engineering programs.
- Add tests for group, required-subject, threshold, missing-subject, and conflicting-evidence cases.

Exit condition: eligibility tests cover every current program and the six workbook profiles.

## Phase 4 — Suitability and recommendation engine

- Implement academic, interest, aptitude, final score, confidence, and explanation outputs.
- Re-normalize preferred-subject weights only across available subjects.
- Rank eligible programs only.
- Add low-confidence and poor-institutional-fit warnings.
- Compare results with the workbook's expected test outcomes.

Exit condition: results are reproducible, explainable, and reviewed as model guidance rather than official admission scoring.

## Phase 5 — Student experience

- Build the group and marks form.
- Build short interest and aptitude self-assessments.
- Build results, comparison, evidence, disclaimer, and alternative-pathway views.
- Test mobile layout, keyboard flow, focus behavior, readable errors, and screen-reader labels.

Exit condition: a student can complete the flow locally without an account.

## Phase 6 — Eligibility verification and content review

- Reconcile all criteria with the active admission advertisement for the target intake.
- Replace stale or general evidence with current sources where available.
- Resolve or clearly retain the BS Mathematics conflict.
- Confirm whether all listed programs are open for the target intake.
- Obtain academic/career-counselling review of model weights and explanations.

Exit condition: every rule has a reviewed classification, source, verification date, and applicable admission year.

## Phase 7 — Deployment preparation

- Add privacy, retention, analytics, and security decisions appropriate to the final design.
- Perform accessibility, performance, security, and content checks.
- Add Vercel configuration only when deployment is approved.
- Consider Supabase only if a later requirement clearly needs persistent data.

Exit condition: the project owner approves a public deployment and all production disclaimers are visible.

## Later possibilities, not commitments

- Saved profiles or counsellor workflows after privacy and authentication design.
- Admin editing after access-control and audit requirements are defined.
- Additional institutions only after the data model supports institution-specific evidence.
- Urdu or Sindhi localization after the English MVP is stable.

External AI APIs, OCR, and paid services are not planned for the MVP.
