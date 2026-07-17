# Product Requirements Document

## Product summary

SIBAU Degree Advisor is an independent guidance tool for students exploring undergraduate programs offered by Sukkur IBA University. It will filter programs by eligibility, estimate academic suitability, compare interests and aptitude, and explain why each program may or may not fit.

SIBAU Degree Advisor is not an official Sukkur IBA admissions system. Recommendations provide guidance and do not guarantee admission. The current admission advertisement and the university's admissions office remain authoritative.

## Problem

Students may find it difficult to combine admission criteria, subject preparation, interests, and aptitude when choosing a degree. Program pages may also describe requirements in different places or for different admission years. The product should make the comparison understandable without turning assumptions into official policy.

## MVP goals

- Let a student enter an Intermediate group and subject marks.
- Let a student complete short interest and aptitude self-assessments.
- Evaluate each program as Eligible, Not eligible, or Verification required.
- Rank only eligible programs using transparent suitability scores.
- Explain the major reasons for each result.
- Show official source links and last-verified dates.
- Warn users when criteria need confirmation against the current admission advertisement.
- Warn users when Sukkur IBA University may not offer a close match for their goals.

## Non-goals for the first MVP

- Applying to Sukkur IBA University.
- Predicting admission-test performance, merit position, or acceptance.
- Replacing official admissions guidance.
- Supabase or another database.
- Authentication or user accounts.
- External AI APIs.
- OCR or automatic reading of marks sheets.
- Paid services.
- Long-term storage of student profiles.

## Intended users

- Intermediate students comparing undergraduate options.
- Parents or guardians supporting a student's decision.
- School or college counsellors using the tool as a conversation aid.
- Project maintainers verifying program and eligibility data.

## Core user journey

1. Read a short disclaimer and data-use notice.
2. Select the Intermediate group.
3. Enter marks or percentages for subjects actually studied.
4. Answer interest and aptitude self-assessment questions.
5. Review eligibility results before suitability rankings.
6. Explore recommended programs, explanations, sources, and warnings.
7. Open the official source and confirm the current admission advertisement before acting.

## Functional requirements

### Student input

- Support at least Pre-Medical, Pre-Engineering, ICS, Commerce, and Arts/Humanities groups used by the workbook test profiles.
- Ask only for subjects relevant to the selected group while allowing documented equivalents later.
- Distinguish “not studied” from a mark of zero.
- Validate that entered marks are within an allowed range.
- Keep interest and aptitude questions understandable and non-diagnostic.

### Eligibility

- Run hard eligibility checks before suitability scoring.
- Keep three result states: Eligible, Not eligible, and Verification required.
- Apply the working Pre-Medical rule documented in `ELIGIBILITY_RULES.md`.
- Apply separate restricted rules to BE Electrical Engineering and BE Computer Systems Engineering.
- Never turn a preferred subject into a hard requirement unless current official evidence supports it.
- Display the source URL, last-verified date, and current-advertisement warning.

### Recommendations

- Calculate separate academic, interest, and aptitude scores.
- Make the component scores and important reasons visible.
- Rank only programs marked Eligible.
- Keep Verification required programs visible without giving them an eligible rank.
- Keep Not eligible programs visible under alternative pathways with the failed hard rule explained.
- Avoid overstating weak or conflicting matches.

### Content administration for the first MVP

- Use a validated, read-only application data file derived from the Excel knowledge base.
- Preserve program IDs, source URLs, last-verified dates, and evidence notes.
- Fail validation when required data is absent or malformed.
- Keep source updates reviewable in Git until a database is approved.

## Rule classification

Every rule must have one of these labels:

1. **Confirmed official eligibility** — supported by a current authoritative Sukkur IBA University source.
2. **Working MVP eligibility rule** — a project rule used for current behavior but not claimed as official policy.
3. **Recommendation-model assumption** — a project choice used to estimate suitability, confidence, or ordering.

Uncertain, old, general, or conflicting evidence must be marked **verification required against the current admission advertisement**.

## Success criteria for the first usable MVP

- All knowledge-base programs load with valid IDs and evidence metadata.
- The six workbook test profiles produce explainable results.
- A Pre-Medical student remains eligible for every included non-engineering program.
- A Pre-Medical student is not eligible for BE Electrical Engineering or BE Computer Systems Engineering.
- Missing Mathematics does not automatically disqualify a Pre-Medical student from a non-engineering program.
- Restricted engineering thresholds are tested independently.
- Users can distinguish official evidence from assumptions on every result.
- Basic keyboard, mobile, and screen-reader checks pass.

## Risks

- Admission rules can change by intake.
- Official pages may mix current and legacy information.
- The working Pre-Medical rule may conflict with a current advertisement.
- Model weights may create misleading precision.
- Self-assessment answers are subjective.
- A student may mistake a recommendation for an admission decision.

The MVP reduces these risks with dates, source links, visible classifications, warnings, test profiles, and conservative language.
