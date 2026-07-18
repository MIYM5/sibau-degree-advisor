# Roadmap

This roadmap keeps SIBAU Degree Advisor small enough for a first full web application while protecting the accuracy of eligibility guidance. Dates are intentionally not promised yet.

## Version baselines

- Version 1 is preserved on the `main` branch and tag `v1.0.0`.
- Version 2 development occurs on the `version-2.0` branch.
- Version 2 includes assessment-mode architecture, RIASEC data infrastructure, the five-scenario Quick Guidance interest activity, the 30-item Detailed Guidance RIASEC interest assessment, five shared objective aptitude tasks, and mode-aware recommendation scoring. Eligibility remains unchanged and Version 1 payloads retain their legacy scoring.

## Version 2 staged assessment upgrade

Status: **In progress**

### Stage 1 — Mode architecture

Status: **Complete**

- Add Quick Guidance and Detailed Guidance metadata.
- Add a responsive mode-selection route.
- Store and validate the selected mode in temporary session storage.
- Preserve valid Version 1 sessions that have no mode selection.
- Route both choices through the existing working assessment until their new content is approved.

### Stage 2 — RIASEC domain and program mappings

Status: **Complete and active in Version 2 scoring; expert review pending**

- Define stable Realistic, Investigative, Artistic, Social, Enterprising, and Conventional IDs.
- Define complete 0–100 profiles, deterministic top-three ordering, and Holland-style codes.
- Add one explicit six-dimension mapping totaling 100 for each of the 14 current programs.
- Validate program coverage, IDs, dimensions, ranges, totals, and stable ordering.
- Keep the model separate from legacy Version 1 interest dimensions.

The mappings are project-model assumptions, not official SIBAU weightages, and were not supplied or endorsed by O*NET. Their Version 2 activation does not remove the need for faculty and career-guidance review.

### Stage 3 — Quick Guidance RIASEC interests

Status: **Complete and active in Quick scoring; expert and usability review pending**

- Add five original broad scenarios covering every RIASEC dimension.
- Require different most, second, and least preferences in each scenario.
- Normalize raw scores to 0–100 and generate the deterministic preliminary profile.
- Preserve responses across navigation and same-session result editing.
- Display six scores, top three, code, evidence label, and disclaimer during review.
- Keep Quick RIASEC values separate from legacy Version 1 interest dimensions.

Quick Guidance uses the shared five-task aptitude exercise recorded in Stage 5. The interest activity is not the official O*NET Interest Profiler or a validated psychometric assessment.

### Stage 4 â€” Detailed Guidance RIASEC interests

Status: **Complete and active in Detailed scoring; pilot testing and expert review pending**

- Add 30 original activity-preference questions, with five for each RIASEC dimension.
- Map the five response choices to 0, 25, 50, 75, and 100 before averaging by dimension.
- Validate complete coverage, IDs, order, dimensions, response values, and malformed data.
- Preserve answers across navigation and same-session result editing.
- Display six scores, coverage, top three, code, explanation, evidence label, and disclaimer during review.
- Keep Detailed RIASEC values separate from legacy Version 1 interest dimensions.
- Preserve the Version 1 interest questionnaire for legacy sessions and historical tests.

Detailed Guidance uses the shared five-task aptitude exercise recorded in Stage 5. The project-designed interest instrument is not the official O*NET Interest Profiler or a validated psychometric assessment.

### Stage 5 â€” Shared brief aptitude exercise

Status: **Complete and active as limited Version 2 evidence; pilot testing and expert review pending**

- Add five original objective multiple-choice tasks covering selected reasoning areas.
- Use one shared task bank for Quick and Detailed Guidance.
- Keep correct-answer metadata outside user-facing task objects and component props.
- Score one point per correct response and show total, overall percentage, coverage, and `Limited` confidence.
- Display per-task Correct/Incorrect outcomes without dimension-level aptitude percentages.
- Store new responses in version-2 session and recommendation payloads.
- Preserve the Version 1 18-item aptitude modules for older sessions and historical tests.
- Use only the overall percentage at 15%; do not invent dimension-level aptitude scores.

The five tasks are original project content, not a validated psychometric instrument or a complete measure of aptitude. Client-side answer-key separation is not a security boundary.

### Stage 6 â€” Mode-aware recommendation scoring

Status: **Complete for Version 2 development; expert validation pending**

- Use the strict Quick 55/30/15 and Detailed 50/35/15 formulas.
- Score all six student RIASEC dimensions against the six-dimension program mappings.
- Use the same overall five-task aptitude percentage as a limited 15% indicator for every program.
- Store and validate mode, scoring model, questionnaire version, and evidence labels.
- Reject incomplete or inconsistent Version 2 evidence without neutral fallbacks.
- Keep Quick confidence at Low or Medium and allow Detailed High only under documented complete-evidence and alignment assumptions.
- Preserve Version 1 50/30/20 behavior and payload parsing.
- Keep eligibility separate, process all 14 programs, and rank only Eligible results.

The activated formulas, mappings, and confidence thresholds remain project assumptions. They are not official SIBAU weightages or validated psychometric standards.

### Planned later stages

- Review the RIASEC program mappings with faculty and career-guidance experts.
- Pilot and review the five aptitude tasks with relevant educational-measurement experts.
- Pilot the assessments and review scoring assumptions with relevant experts.
- Revisit confidence thresholds only with documented evidence and regression tests.

The planned question counts and evidence labels are recommendation-model design assumptions. New content must be reviewed before it replaces the current questionnaires.

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
