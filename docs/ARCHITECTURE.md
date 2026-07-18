# Architecture

## Overview

SIBAU Degree Advisor is a single Next.js application with local, version-controlled program data. The design keeps official evidence, eligibility decisions, and suitability scoring separate so each can be reviewed and tested independently.

Version 1 is preserved on `main` and tag `v1.0.0`. Version 2 architecture work takes place on `version-2.0`. The current Version 2 stage introduces assessment-mode selection without changing the working Version 1 questionnaires, scoring, eligibility, recommendation engine, or results.

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
3. Both modes currently continue to `/assessment`, where the existing Version 1 questionnaires remain active during this architecture stage.
4. The student enters basic information and subject marks, then completes the existing interest and aptitude self-assessments.
5. The Review step keeps the editable answers in React state until the student selects **View My Recommendations**.
6. `assessment-to-student-profile.ts` validates the complete assessment, calculates the dimension scores, and creates the existing `StudentProfile` shape.
7. The recommendation engine checks eligibility first, calculates suitability without changing eligibility, and ranks only eligible programs.
8. A versioned payload containing the editable assessment draft, normalized profile, and generated result is written to browser `sessionStorage`.
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
