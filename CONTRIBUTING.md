# Contributing to SIBAU Degree Advisor

Thank you for helping improve SIBAU Degree Advisor. This project is being built in small, reviewable stages so that its eligibility and recommendation logic remains understandable.

## Before starting

1. Read `README.md`, `AGENTS.md`, `docs/PRD.md`, `docs/ELIGIBILITY_RULES.md`, and `docs/DECISIONS.md`.
2. Check `docs/TASKS.md` and choose one clearly scoped task.
3. Confirm whether the task changes official evidence, a working MVP rule, or a model assumption.
4. Do not include real student personal data, secrets, or credentials.

## Types of rules

- **Confirmed official eligibility:** supported by a current, authoritative Sukkur IBA University source.
- **Working MVP eligibility rule:** a project rule used so development and testing can continue; it is not presented as official policy.
- **Recommendation-model assumption:** a project choice used to measure suitability, such as weights or confidence thresholds.

Never move a rule into a stronger category without evidence and review.

## Suggested workflow

1. Create a focused branch after the initial baseline is approved.
2. Make the smallest change that solves the task.
3. Update documentation and tests with the code.
4. Run the available checks.
5. Review the diff for secrets, generated files, accidental workbook changes, and unsupported eligibility claims.
6. Open a pull request using the repository template.

## Eligibility-data changes

For every eligibility update, include:

- program name and intake/admission year;
- exact source URL;
- last-verified date in `YYYY-MM-DD` format;
- what changed and why;
- whether the source is the current admission advertisement, a program page, an older handbook, or another source;
- any remaining uncertainty or conflict;
- test cases affected by the change.

Do not overwrite the Excel knowledge base merely to tidy formatting. Preserve source URLs, verification dates, and existing evidence notes.

## Code expectations

- Prefer simple TypeScript with clear names.
- Keep eligibility checks separate from suitability scoring.
- Avoid hiding “Not eligible” or “Verification required” results.
- Add tests for edge cases, especially Pre-Medical and restricted engineering programs.
- Keep accessibility and mobile layouts in mind.
- Avoid new services or dependencies unless the task requires them and the decision is documented.

## Commit messages

Use an imperative, focused message. Examples:

- `docs: add project documentation foundation`
- `feat: add eligibility evaluation types`
- `test: cover pre-medical engineering restrictions`

## Pull requests

A pull request should explain the user-facing result, evidence or assumptions used, tests performed, documentation changed, and unresolved risks. A reviewer should be able to understand an eligibility change without reading the implementation first.
