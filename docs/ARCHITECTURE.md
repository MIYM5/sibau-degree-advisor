# Architecture

## Overview

SIBAU Degree Advisor is a single Next.js application with local, version-controlled program data. The design keeps official evidence, eligibility decisions, and suitability scoring separate so each can be reviewed and tested independently.

Version 1 is preserved on `main` and tag `v1.0.0`. Version 2 work takes place on `version-2.0`. Quick and Detailed Guidance have separate RIASEC interest collection, share one five-task objective aptitude exercise, and use explicit mode-aware scoring. Eligibility remains unchanged and separate from suitability.

## Planned layers

### 1. Presentation layer

App Router pages and reusable React components will handle:

- the disclaimer and privacy notice;
- age-group selection, operational consent, and independent optional choices;
- Intermediate group and marks input;
- interest and aptitude questions;
- results, explanations, warnings, and source links;
- presentation-only grouping of ranked results and score-gap labels;
- optional post-results feedback that is isolated from recommendation behavior;
- accessible loading, validation, and error states.

Presentation components should display decisions, not contain admission rules.

### 2. Application layer

Small workflow functions coordinate:

- form validation;
- normalized student-profile creation;
- eligibility evaluation;
- suitability calculation;
- ranking and explanation generation.

This layer should remain independent of page rendering where practical.

### 3. Domain layer

Pure TypeScript modules will contain the main rules:

- `eligibility` returns Eligible, Not eligible, or Verification required with reason codes and evidence references;
- `academic suitability` scores relevant available subjects;
- `interest suitability` scores stated interests;
- `aptitude suitability` scores self-assessment dimensions;
- `recommendation` combines components, ranks eligible programs, and calculates confidence;
- `explanations` turns reason codes into plain-language messages.

The eligibility module must not depend on suitability scores. A low suitability score cannot make a student ineligible, and a high suitability score cannot bypass a hard eligibility rule.

### 4. Data layer

For the first MVP:

- the Excel workbook remains the protected source knowledge base;
- a repeatable script may later create a validated JSON or TypeScript data artifact;
- the web app reads the validated artifact without writing back to the workbook;
- source URL, last-verified date, applicable admission year, and evidence status travel with every program rule.

Supabase is not part of this phase.

## Current folder structure

```text
src/app/                # App Router routes and layouts
src/components/         # Reusable user-interface components
src/data/               # Typed questions and reviewed program data
src/lib/                # Validation, eligibility, scoring, and workflows
src/types/              # Shared domain types
data/                   # Protected Excel knowledge base
docs/                   # Project documentation
scripts/                # Development validation and focused tests
```

## Main request flow

1. **Start Assessment** opens `/assessment/mode`.
2. The student selects Quick Guidance or Detailed Guidance. A dedicated, versioned session record stores the choice and `/consent` opens.
3. The student selects an age group and reviews the Privacy and Research Data Notice. Required operational consent must be granted; research, follow-up contact, and future analytics choices remain optional and independent.
4. A valid versioned consent record permits `/assessment` to open for the selected Version 2 mode. A valid Version 1 draft retains its compatibility path.
5. Both modes collect basic information and subject marks.
6. Quick Guidance completes five project-designed RIASEC scenarios. Detailed Guidance completes 30 project-designed RIASEC activity-preference questions, with five questions for each dimension. Both modes then complete the same five objective aptitude tasks.
7. The Review step shows the selected mode's RIASEC profile plus five aptitude-task outcomes, total correct, overall percentage, `Limited` confidence, and disclaimers. It keeps editable answers in React state until the student selects **View My Recommendations**.
8. `assessment-to-student-profile.ts` creates a discriminated Version 2 recommendation input containing the academic profile, selected mode, native RIASEC result, and brief aptitude result. It does not force Version 2 evidence into legacy `StudentProfile` dimensions.
9. The recommendation engine checks eligibility first. Quick uses 55/30/15 and Detailed uses 50/35/15 for academic, RIASEC, and brief aptitude suitability; only eligible programs are ranked.
10. A versioned payload containing the editable draft, strict recommendation input, scoring metadata, and generated result is written to browser `sessionStorage`. Version 1 payloads retain their original profile-based shape.
11. `/results` validates that payload, then `recommendation-presentation.ts` groups existing eligible ranks 1â€“3 as Top Matches and ranks 4â€“5 as Alternative Options. It compares adjacent eligible scores for display without sorting or recalculating them.
12. The page shows engine warnings before recommendation cards, keeps verification-required and not-eligible programs unranked, and finishes with a mode-aware student-profile and methodology summary. Version 1 payloads use a compatible legacy summary.
13. After Quick or Detailed recommendations are visible, the student may submit or skip a short feedback form. Feedback uses its own validator and session key and never calls eligibility, scoring, ranking, or confidence logic.

The engine runs only after final Review confirmation. The interface does not copy eligibility or scoring rules into React components.

### Results presentation boundary

`recommendation-presentation.ts` is a pure display adapter. It validates rank sequence and eligibility classifications, preserves the engine's deterministic order, takes at most ranks 1â€“5 for the shortlist, and adds adjacent-score comparison labels. It never calls scoring or eligibility logic.

- below 3 points: `Approximately equal match`;
- 3 to below 7 points: `Moderately stronger match`;
- 7 points or more: `Clearly stronger match`.

Rank 1 has no comparison label. Full precision remains in the engine result; the UI formats scores and differences to one decimal place. Small differences are guidance and must not be described as statistically significant.

## Browser-session state transfer

The current MVP uses `sessionStorage` because `/assessment` and `/results` are separate routes and there is no database. It is a temporary route-to-route handoff, not durable profile storage.

- Data is limited to the current browser tab session and is not placed in `localStorage`.
- The stored payload has an explicit version and is checked at runtime before use.
- The stored profile is rebuilt from the draft and compared with the stored profile, so inconsistent or malformed data is rejected.
- **Edit My Answers** returns to the Review step with the current draft restored.
- **Retake Assessment** removes both the draft and result payload before starting again.
- Opening `/results` without valid session data shows a neutral empty state.

This is client-side validation for a guidance tool, not a security boundary. A future server-backed design must validate all submitted data again and document retention, consent, and access controls before storing student information.

### Consent and privacy record

New Version 2 assessment access requires a dedicated consent record:

- key: `sibau-degree-advisor:consent:v1`;
- schema: `1`;
- displayed versions: `privacy-v1.0` and `consent-v1.0`;
- contents: anonymous UUID, selected mode, age group, required operational consent, three independent optional choices, guardian-status metadata, derived research-storage eligibility, versions, and timestamp;
- excluded data: student name, contact details, CNIC, address, marks, interest or aptitude answers, and recommendation results.

Adults who grant optional research consent receive future-ready `eligible` metadata. Adult refusal does not block guidance. Every minor receives `not_eligible_minor_process_required`, including a minor who checks the voluntary research box. Age 16-17 uses `future_approved_process_required`; under 16 uses `required_not_collected`. These values do not create a research database or claim that a guardian or institution has approved participation.

`/assessment` validates the selected mode and operational consent before starting or generating new Version 2 results. If the mode is absent it redirects to `/assessment/mode`; if consent is absent, malformed, outdated, false, or for another mode it redirects to `/consent`. Valid Version 1 drafts may continue without retroactively inventing consent. Retake preserves valid consent for the current tab, while selecting a mode again resets consent and assessment progress.

The compact essential-storage notice is informational, not a cookie-consent banner. Its dismissal uses `sibau-degree-advisor:essential-storage-notice:v1`, separate from every consent category. No analytics or non-essential cookies are loaded.

### Post-results feedback record

Quick and Detailed results use another dedicated session record for optional feedback:

- key: `sibau-degree-advisor:assessment-feedback:v1`;
- schema version: `1`;
- contents: an anonymous feedback/session ID, the recommendation-session timestamp used to keep the record tied to the current result, and at most one validated feedback record;
- excluded data: student name, contact details, exact subject marks, raw RIASEC responses, and raw aptitude responses;
- duplicate behavior: a second submission for the same assessment session is rejected;
- refresh behavior: a valid submitted record is restored in the same browser tab and shows confirmation instead of a new form.

The feedback component appears only after Version 2 Quick or Detailed results have been displayed. It can suggest the visible placement of a selected SIBAU program, but the student confirms the value. It does not infer a placement for an outside-SIBAU field, no previous choice, or prefer not to answer.

Feedback measures perceived relevance and explanation usefulness. It does not establish scientific validity, is not included in recommendation or confidence calculations, and is not permanent research storage. Any later research database requires a separate decision covering informed consent, privacy notice, retention, access, deletion, security, and ethical review where applicable.

### Assessment-mode record

Mode selection uses a separate record so it does not change the Version 1 assessment or recommendation payloads:

- key: `sibau-degree-advisor:assessment-mode:v1`;
- payload schema version: `1`;
- selected value: `quick` or `detailed`;
- runtime behavior: unknown modes, malformed JSON, and unsupported versions are rejected.

If `/assessment` has neither a valid mode record nor a valid legacy Version 1 draft, it redirects to `/assessment/mode`. A valid Version 1 draft with no mode record is treated as legacy session data and remains accessible. Existing results are not rejected merely because they predate assessment modes.

### Quick Guidance interest state

Five Quick RIASEC scenario responses remain in React state during the assessment. A backward-compatible optional `quickInterestResponses` field is added to the Version 1 assessment draft only when Quick Guidance reaches results. Existing drafts without this field keep their previous validation and restoration behavior.

Quick responses are validated before restoration. New Version 2 sessions use the complete six-dimension result with the `version-2-quick-55-30-15` scoring model. Missing or mismatched evidence is rejected; it is never replaced by a neutral interest score.

### Detailed Guidance interest state

Thirty Detailed RIASEC responses remain in React state during the assessment. A backward-compatible optional `detailedInterestResponses` field is added to the Version 1 assessment draft only when the new Detailed Guidance flow reaches results. The validator requires every known question exactly once, rejects malformed or out-of-range values, and rejects a draft containing both Quick and Detailed response fields.

Detailed responses are validated before restoration. New Version 2 sessions use the complete six-dimension result with the `version-2-detailed-50-35-15` scoring model. Missing or mismatched evidence is rejected.

Drafts without either mode-specific field remain valid Version 1 sessions. They continue through the legacy 22-item interest scoring and profile-building path, even if an older browser tab also contains assessment-mode metadata. The old question data and scorer therefore remain available for backward compatibility and historical tests.

### Version 2 brief aptitude state

Both modes use the same five-task bank. The UI receives task titles, questions, dimensions, and choices but no correct-answer metadata. The answer key remains inside the local scoring module and is not passed through component props or rendered HTML. Because scoring still runs in downloaded client-side MVP code, this separation improves architecture but is not a security boundary.

New drafts set `schemaVersion: 2` and store a complete `briefAptitudeResponses` list. Their recommendation payload uses version `2`. The session validator requires all five known tasks, known choices belonging to their task, and exactly one Quick or Detailed interest field. It rebuilds the strict mode-aware input and recommendation result, rejecting inconsistent scores, modes, questionnaire versions, or scoring versions.

Version 1 payloads and earlier mode-specific drafts without `briefAptitudeResponses` remain valid through the Version 1 profile and 18-item aptitude path. New Quick and Detailed sessions use the strict Version 2 payload and do not silently fall back to Version 1 scoring.

## Key boundaries

- **Official evidence boundary:** source facts and their provenance.
- **Working-rule boundary:** project behavior awaiting full official reconciliation.
- **Model boundary:** weights, scoring, confidence, and ranking assumptions.
- **User-data boundary:** transient student inputs that must not leak into logs or source control.

## Testing approach

- Unit tests for pure eligibility and scoring functions.
- Table-driven tests for every program and Intermediate group.
- Regression tests based on the six workbook student profiles.
- Integration tests for form-to-result behavior.
- Accessibility checks for forms, errors, focus, and results.
- Data-validation tests for IDs, URLs, dates, rule labels, and weight totals.

## Error handling

- Reject malformed knowledge-base data during development or build rather than guessing.
- Show a neutral “verification required” message for incomplete policy evidence.
- Never silently convert an unknown rule into Eligible or Not eligible.
- Keep technical errors separate from admission guidance.

## Future architecture decisions

Before adding Supabase, authentication, deployment analytics, or saved profiles, record the purpose, data involved, retention period, access controls, costs, alternatives, and rollback plan in `DECISIONS.md`.
