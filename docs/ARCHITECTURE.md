# Architecture

## Overview

SIBAU Degree Advisor is a single Next.js application with local, version-controlled program data. The design keeps official evidence, eligibility decisions, and suitability scoring separate so each can be reviewed and tested independently.

Version 1 is preserved on `main` and tag `v1.0.0`. Version 2 work takes place on `version-2.0`. Quick and Detailed Guidance have separate RIASEC interest collection, share one five-task objective aptitude exercise, and use explicit mode-aware scoring. Eligibility remains unchanged and separate from suitability.

## Planned layers

### 1. Presentation layer

App Router pages and reusable React components will handle:

- the disclaimer and privacy notice;
- Intermediate group and marks input;
- interest and aptitude questions;
- results, explanations, warnings, and source links;
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
2. The student selects Quick Guidance or Detailed Guidance. A dedicated, versioned session record stores the choice.
3. Both modes continue to `/assessment` for basic information and subject marks.
4. Quick Guidance completes five project-designed RIASEC scenarios. Detailed Guidance completes 30 project-designed RIASEC activity-preference questions, with five questions for each dimension. Both modes then complete the same five objective aptitude tasks.
5. The Review step shows the selected mode's RIASEC profile plus five aptitude-task outcomes, total correct, overall percentage, `Limited` confidence, and disclaimers. It keeps editable answers in React state until the student selects **View My Recommendations**.
6. `assessment-to-student-profile.ts` creates a discriminated Version 2 recommendation input containing the academic profile, selected mode, native RIASEC result, and brief aptitude result. It does not force Version 2 evidence into legacy `StudentProfile` dimensions.
7. The recommendation engine checks eligibility first. Quick uses 55/30/15 and Detailed uses 50/35/15 for academic, RIASEC, and brief aptitude suitability; only eligible programs are ranked.
8. A versioned payload containing the editable draft, strict recommendation input, scoring metadata, and generated result is written to browser `sessionStorage`. Version 1 payloads retain their original profile-based shape.
9. `/results` validates that payload before displaying summaries, ranked eligible programs, unranked verification-required and not-eligible programs, explanations, source notes, and warnings.

The engine runs only after final Review confirmation. The interface does not copy eligibility or scoring rules into React components.

## Browser-session state transfer

The current MVP uses `sessionStorage` because `/assessment` and `/results` are separate routes and there is no database. It is a temporary route-to-route handoff, not durable profile storage.

- Data is limited to the current browser tab session and is not placed in `localStorage`.
- The stored payload has an explicit version and is checked at runtime before use.
- The stored profile is rebuilt from the draft and compared with the stored profile, so inconsistent or malformed data is rejected.
- **Edit My Answers** returns to the Review step with the current draft restored.
- **Retake Assessment** removes both the draft and result payload before starting again.
- Opening `/results` without valid session data shows a neutral empty state.

This is client-side validation for a guidance tool, not a security boundary. A future server-backed design must validate all submitted data again and document retention, consent, and access controls before storing student information.

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
