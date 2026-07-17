# Tasks

This list tracks small, beginner-friendly milestones for SIBAU Degree Advisor. Do not start later phases before their prerequisites are approved.

## Documentation foundation

- [x] Inspect the repository and Git state.
- [x] Preserve and inspect the Excel knowledge base.
- [x] Create root project documents.
- [x] Create product, architecture, data, scoring, eligibility, decision, roadmap, and task documents.
- [x] Create GitHub contribution templates.
- [ ] Project owner reviews and approves the documentation foundation.
- [ ] Make the approved initial commit.

## Eligibility verification

- [ ] Locate the direct current admission advertisement/eligibility PDF for the target intake.
- [ ] Record its exact URL, publication/admission year, and verification date.
- [ ] Reconcile every program row with the current advertisement.
- [ ] Resolve or explicitly retain the BS Mathematics Pre-Medical conflict.
- [ ] Verify both engineering programs' group, subject, overall, and subject thresholds.
- [ ] Verify whether supplementary and condoned-subject restrictions apply to each program.
- [ ] Verify which programs are open for the target intake.
- [ ] Decide whether the associate degree belongs in MVP results.
- [ ] Review weight assumptions with an academic or career-counselling expert.

## Next.js foundation — only after approval

- [ ] Initialize Next.js with TypeScript, Tailwind CSS, App Router, and npm.
- [ ] Confirm generated files do not replace the workbook or documentation.
- [ ] Add scripts for development, build, linting, type checking, and tests.
- [ ] Add a simple accessible layout and home page.
- [ ] Document the local setup steps in `README.md`.

## Data import and validation

- [ ] Define TypeScript types for program, evidence, eligibility rule, and weights.
- [ ] Choose a lightweight validation approach.
- [ ] Create a repeatable workbook-to-application data conversion process.
- [ ] Preserve exact source URLs and last-verified dates.
- [ ] Validate 14 current program rows and unique IDs.
- [ ] Validate each weight group totals 100.
- [ ] Add a check that model weights cannot create hard prerequisites.
- [ ] Document the generated-data review workflow.

## Eligibility engine

- [ ] Implement the three eligibility states.
- [ ] Implement the exact working Pre-Medical rule.
- [ ] Implement BE Electrical Engineering restricted rules separately.
- [ ] Implement BE Computer Systems Engineering restricted rules separately.
- [ ] Add reason codes and evidence references.
- [ ] Add table-driven tests for every program and group.
- [ ] Test missing preferred subjects separately from missing required subjects.

## Scoring and recommendations

- [ ] Implement academic suitability with safe missing-subject handling.
- [ ] Implement interest suitability.
- [ ] Implement aptitude suitability.
- [ ] Implement the documented 50/30/20 model formula behind a clearly named configuration.
- [ ] Rank eligible programs only.
- [ ] Define and test confidence behavior.
- [ ] Add institutional-fit warnings.
- [ ] Reproduce and review the six workbook test profiles.

## Student interface

- [ ] Build the disclaimer and privacy notice.
- [ ] Build Intermediate group and marks inputs.
- [ ] Build interest questions.
- [ ] Build aptitude self-assessment questions.
- [ ] Build explainable results with evidence links and dates.
- [ ] Build alternative pathways for Not eligible results.
- [ ] Add mobile, keyboard, focus, and screen-reader checks.

## Deployment preparation — later

- [ ] Approve privacy, retention, security, and analytics decisions.
- [ ] Review production eligibility evidence.
- [ ] Run accessibility, performance, dependency, and security checks.
- [ ] Add Vercel only when deployment is approved.

## Explicitly out of current scope

- Supabase
- authentication
- external AI APIs
- OCR
- paid services
- public deployment
