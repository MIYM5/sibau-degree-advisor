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

## D-009 — Apply conservative eligibility-result precedence

- **Status:** Accepted for MVP development; current-advertisement verification remains required
- **Date:** 2026-07-18
- **Context:** Eligibility must distinguish confirmed hard failures from source uncertainty. The committed engineering records are conservatively classified `verification_required`, while the approved MVP explicitly defines their restricted group, subject, and threshold behavior.
- **Decision:** A failed stored hard rule returns Not eligible. An explicitly approved working-MVP outcome returns Eligible when its hard rules pass: Pre-Medical access to included non-engineering programs, and the restricted rules for BE Electrical Engineering and BE Computer Systems Engineering. Other passing records classified `verification_required` return Verification required. Overall percentage is calculated as total obtained marks divided by total possible marks across the supplied subjects.
- **Consequences:** The engine never uses suitability weights for eligibility. Passing engineering cases remain usable for MVP testing without presenting their rules as final official policy, while other ambiguous evidence remains visible for verification.

## D-010 — Use transparent scoring, evidence, confidence, and warning thresholds

- **Status:** Accepted for MVP development; expert review remains required before production
- **Date:** 2026-07-18
- **Context:** The workbook defines program weights and a 50/30/20 final formula but does not define exact confidence thresholds, invalid-input handling, deterministic ties, or institutional-fit warning triggers.
- **Decision:** Calculate suitability only after eligibility. Omit missing or invalid weighted inputs and re-normalize across valid evidence. When a component has no valid weighted evidence, use a neutral 50-point placeholder with zero coverage rather than treating missing evidence as zero. Combine evidence coverage using 50/30/20. Use a 12.5-point component-alignment threshold, a 65% minimum evidence threshold, deterministic program-name/ID tie-breaking, the documented recommendation bands, and the transparent health, weak-top-score, insufficient-evidence, and no-eligible-program warning triggers in `SCORING_MODEL.md`. A flat interest-and-aptitude profile is Low confidence under the documented response-range thresholds.
- **Consequences:** Scores stay within 0–100 and remain explainable without creating eligibility. Verification-required and not-eligible programs can still show suitability for guidance but remain unranked and outside the eligible top five. These thresholds are recommendation-model assumptions, not official university rules or validated psychometric standards.

## D-011 — Add reviewed-before-use RIASEC infrastructure for Version 2

- **Status:** Accepted as inactive Version 2 infrastructure; expert review and scoring integration remain pending
- **Date:** 2026-07-18
- **Context:** Detailed Guidance is planned to use 30 RIASEC interest items. The project needs stable dimensions and explicit program mappings before questionnaire and scoring work can be reviewed independently.
- **Decision:** Define the stable R-I-A-S-E-C order, complete six-dimension profiles, deterministic top-three codes, and one explicit 100-point mapping for every current program. Keep these structures separate from the active Version 1 interest model and recommendation engine.
- **Consequences:** RIASEC data can be validated and reviewed without changing current results. The mappings are project assumptions, not official SIBAU weightages, and were not supplied or endorsed by O*NET. Faculty and career-guidance experts must review them before a later approved task connects them to student responses or recommendations.

## Open decisions

- Which exact 2026 admission advertisement is the final authority, and what is its direct URL?
- How should the BS Mathematics source conflict be resolved for production?
- Is the Associate Degree in Physical Education & Sports Sciences inside the final undergraduate recommendation scope?
- Which interest and aptitude question scales will be used?
- Which experts will review the Version 2 RIASEC program mappings, and what evidence will support revisions?
- How should reviewed Quick and Detailed RIASEC evidence map into the active interest suitability component?
- What test framework and data-validation library should be selected during Next.js setup?
- What license should the repository use?
- When, if ever, does the product need persistent data, authentication, or Supabase?
