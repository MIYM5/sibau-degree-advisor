# Decision Log

This file records decisions that shape SIBAU Degree Advisor. New entries should explain context, decision, consequences, and unresolved work.

## D-001 — Keep the Excel workbook as the protected source knowledge base

- **Status:** Accepted for the documentation phase
- **Date:** 2026-07-17
- **Context:** The repository contains an Excel workbook with programs, sources, verification dates, weights, and test profiles.
- **Decision:** Preserve the workbook unchanged. A later approved task may create a repeatable, validated application data artifact without overwriting the source.
- **Consequences:** Source URLs and dates remain auditable. The application will need an import/validation step.

## D-002 — Separate eligibility from suitability

- **Status:** Accepted
- **Date:** 2026-07-17
- **Context:** Marks, interests, and aptitude should help explain fit but must not invent admission rules.
- **Decision:** Evaluate hard eligibility first. Suitability scores cannot change a hard eligibility outcome.
- **Consequences:** Domain logic and tests must keep eligibility and scoring in separate modules.

## D-003 — Use three eligibility states

- **Status:** Accepted
- **Date:** 2026-07-17
- **Context:** Some workbook criteria are current and specific, while others are general, older, or conflicting.
- **Decision:** Use Eligible, Not eligible, and Verification required. Rank only Eligible programs.
- **Consequences:** The interface must keep uncertain programs visible without presenting them as confirmed eligible.

## D-004 — Apply the provided Pre-Medical rule as a working MVP rule

- **Status:** Accepted for MVP development; official reconciliation pending
- **Date:** 2026-07-17
- **Context:** The project owner supplied a specific behavior for Pre-Medical students.
- **Decision:** Pre-Medical students are eligible for all included non-engineering programs and are not eligible for BE Electrical Engineering or BE Computer Systems Engineering. Missing Mathematics affects suitability only for non-engineering programs.
- **Consequences:** This behavior must be labeled as a working MVP rule. The current advertisement must be checked before production.

## D-005 — Treat weights as model assumptions

- **Status:** Accepted
- **Date:** 2026-07-17
- **Context:** The workbook contains program-specific academic, interest, and aptitude weights plus a 50/30/20 final-score formula.
- **Decision:** Use them only as explainable recommendation-model assumptions, never as official university admission weightages.
- **Consequences:** Weight changes require documentation, tests, and expert review before production.

## D-006 — Do not persist student profiles in the first MVP

- **Status:** Accepted for initial architecture
- **Date:** 2026-07-17
- **Context:** The initial experience can calculate results without accounts or a database.
- **Decision:** Keep student input in browser or request memory. Do not add Supabase or authentication.
- **Consequences:** Lower privacy and security complexity; saved profiles are unavailable.

## D-007 — Exclude external AI APIs, OCR, and paid services

- **Status:** Accepted for MVP scope
- **Date:** 2026-07-17
- **Context:** These services are not required for transparent rules-based recommendations.
- **Decision:** Build the MVP without them.
- **Consequences:** Inputs remain manual and recommendation logic remains locally auditable.

## D-008 — Defer Next.js initialization until documentation approval

- **Status:** Accepted
- **Date:** 2026-07-17
- **Context:** The project owner requested review of the documentation foundation first.
- **Decision:** Do not initialize Next.js, install packages, commit, or push during this task.
- **Consequences:** The repository remains documentation-and-data only until explicit approval.

## Open decisions

- Which exact 2026 admission advertisement is the final authority, and what is its direct URL?
- How should the BS Mathematics source conflict be resolved for production?
- Is the Associate Degree in Physical Education & Sports Sciences inside the final undergraduate recommendation scope?
- Which interest and aptitude question scales will be used?
- How will confidence thresholds and near-ties be calculated and displayed?
- What test framework and data-validation library should be selected during Next.js setup?
- What license should the repository use?
- When, if ever, does the product need persistent data, authentication, or Supabase?
