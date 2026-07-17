# Architecture

## Overview

The first MVP of SIBAU Degree Advisor should be a single Next.js application with local, version-controlled program data. The design keeps official evidence, eligibility decisions, and suitability scoring separate so each can be reviewed and tested independently.

No Next.js application exists yet. This document describes the intended structure for the next approved phase.

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

Small workflow functions will coordinate:

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

## Suggested future folder structure

```text
app/                    # App Router routes and layouts
components/             # Reusable user-interface components
lib/
  domain/               # Eligibility and scoring logic
  data/                 # Loaders and validation
  validation/           # Student-input schemas
data/                   # Protected workbook and derived reviewed data
docs/                   # Project documentation
tests/                  # Unit and integration tests
scripts/                # Repeatable data conversion and validation
```

This structure is a recommendation-model assumption and implementation plan, not a current repository claim.

## Main request flow

1. The student submits group, marks, interests, and aptitude answers.
2. Input validation creates a normalized in-memory student profile.
3. The eligibility engine evaluates every program using hard rules and evidence status.
4. Suitability components are calculated without changing eligibility.
5. The recommendation engine ranks only eligible programs.
6. The interface shows explanations, confidence, source links, verification dates, and disclaimers.

The MVP should process this in the browser or request memory and should not persist student profiles.

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
