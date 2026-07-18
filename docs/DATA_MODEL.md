# Data Model

This document describes the concepts SIBAU Degree Advisor needs. The initial TypeScript definitions are in `src/types/`.

## Design principles

- Use stable program IDs instead of program names as keys.
- Keep eligibility evidence beside the rule it supports.
- Keep official evidence, working MVP rules, and model assumptions distinguishable.
- Represent an unstudied subject as missing, not as zero.
- Preserve source URLs and last-verified dates exactly during import.
- Do not store real student profiles in the first MVP.

## Program

| Field | Purpose |
| --- | --- |
| `id` | Stable workbook program ID, such as `SIBAU-BSCS`. |
| `name` | Official or source-aligned program name. |
| `category` | Broad area used for browsing and explanations. |
| `duration` | Program length as recorded in the knowledge base. |
| `requiredGroups` | Intermediate groups accepted by the selected eligibility rule. `Any Intermediate/F.Sc group` supports the working rule for included non-engineering programs. |
| `requiredSubjects` | Hard subject requirements expressed as either all listed subjects or one of several alternatives. |
| `minimumSubjectPercentage` | Hard subject threshold, or `null` when none applies. |
| `minimumOverallPercentage` | Hard overall threshold, or `null` when none applies. |
| `eligibilityNote` | Plain-language limits, conflicts, or exceptions. |
| `eligibilityClassification` | `confirmed_official`, `working_mvp`, or `verification_required`. |
| `officialSourceUrl` | Exact official source URL recorded for the program. |
| `lastVerified` | Source verification date stored as `YYYY-MM-DD`. |
| `description` | Short, neutral program summary. |
| `careerOptions` | Illustrative career directions, not job guarantees. |
| `academicWeights` | Model-assumption weights by subject. |
| `interestWeights` | Model-assumption weights by interest dimension. |
| `aptitudeWeights` | Model-assumption weights by aptitude dimension. |
| `weightsStatus` | Explicit label showing that the weights are model-defined recommendation assumptions. |

## Eligibility rule

| Field | Purpose |
| --- | --- |
| `eligibilityClassification` | `confirmed_official`, `working_mvp`, or `verification_required`. |
| `requiredGroups` | Groups explicitly allowed by the selected rule. |
| `requiredSubjects` | Subjects that are hard requirements, when supported. |
| `minimumSubjectPercentage` | Hard subject threshold, if supported. |
| `minimumOverallPercentage` | Hard overall threshold, if supported. |
| `eligibilityNote` | Human-readable limits, conflicts, or exceptions. |
| `officialSourceUrl` | Program-level evidence URL preserved from the workbook. |
| `lastVerified` | Date on which the source was last checked. |

Do not put preferred subjects in `requiredSubjects`. For example, Mathematics can affect suitability for a computing program without becoming a hard requirement for a Pre-Medical student under the working MVP rule.

## Evidence record

| Field | Purpose |
| --- | --- |
| `id` | Stable local reference. |
| `sourceUrl` | Exact official URL, or a clearly labeled project-source reference. |
| `sourceType` | Current advertisement, program page, handbook, official general page, or project rule. |
| `lastVerified` | Date checked, stored as `YYYY-MM-DD`. |
| `applicableAdmissionYear` | Intake year supported by the source, or `null` when unknown. |
| `supports` | Narrow statement that the source supports. |
| `caution` | Staleness, conflict, scope, or wording warning. |

The Excel workbook currently records `2026-07-17` as the program-row last-verified date. This does not prove every source is the final authority for the 2026 intake.

## Student profile

The first MVP keeps this object only in React state and temporary browser `sessionStorage`. The `name` field is used for the current guided experience and must not be sent to a database, logged, or placed in long-term browser storage.

| Field | Purpose |
| --- | --- |
| `name` | Student-provided display name used only in the in-memory session. |
| `intermediateGroup` | Student's completed Intermediate/F.Sc group. |
| `subjectMarks` | List of marks for subjects actually studied. Missing subjects are omitted rather than recorded as zero. |
| `interestScores` | Scores mapped to defined interest dimensions. |
| `aptitudeScores` | Self-assessment scores mapped to defined aptitude dimensions. |

Do not persist names or include CNIC numbers, phone numbers, email addresses, roll numbers, or marks-sheet images in the first MVP.

## Assessment session draft

The editable draft supports route-to-route navigation within one browser-tab session. It contains:

| Field | Purpose |
| --- | --- |
| `name` | Current student display name. |
| `intermediateGroup` | Selected Intermediate group. |
| `subjectRows` | Editable subject rows, including whether a row is optional. |
| `interestResponses` | Responses keyed by the typed interest-question IDs. |
| `aptitudeResponses` | Responses keyed by the typed aptitude-question IDs. |
| `quickInterestResponses` | Optional complete five-scenario response list used only by Quick Guidance. Absent from legacy and Detailed drafts. |
| `detailedInterestResponses` | Optional complete 30-question response list used only by the new Detailed Guidance flow. Absent from Quick and legacy drafts. |

The draft is validated before it is restored. It is not a second domain model and is converted into the shared `StudentProfile` before recommendation logic runs.

## Assessment mode

Version 2 introduces a selection before the existing assessment:

```text
AssessmentMode = "quick" | "detailed"
```

Each mode has typed metadata:

| Field | Purpose |
| --- | --- |
| `id` | Stable `quick` or `detailed` identifier. |
| `title` | Student-facing mode name. |
| `description` | Short explanation of the mode's intended depth. |
| `estimatedMinutes` | Minimum and maximum estimated completion time. |
| `interestQuestionCount` | Planned number of interest items. |
| `aptitudeQuestionCount` | Planned number of objective aptitude tasks. |
| `evidenceLabel` | Plain-language strength label for the guidance. |

Quick Guidance uses 5 broad interest scenarios, and Detailed Guidance uses 30 RIASEC interest items. Both modes are planned for 5 objective aptitude tasks but temporarily use the existing 18-item Version 1 aptitude self-assessment.

## Assessment-mode session payload

The mode is stored separately from the assessment draft and recommendation result:

| Field | Purpose |
| --- | --- |
| `version` | Schema version for the dedicated mode payload. The first schema uses `1`. |
| `selectedMode` | Validated `quick` or `detailed` selection. |

The dedicated key is `sibau-degree-advisor:assessment-mode:v1`. Missing mode data is allowed when an otherwise valid Version 1 assessment draft is present. Malformed data, unknown modes, and unsupported versions require a new selection. This separation keeps the existing Version 1 session payloads backward compatible.

## RIASEC interest model

Version 2 infrastructure defines six stable RIASEC dimension IDs in this order:

| Stable ID | Label | Code |
| --- | --- | --- |
| `realistic` | Realistic | R |
| `investigative` | Investigative | I |
| `artistic` | Artistic | A |
| `social` | Social | S |
| `enterprising` | Enterprising | E |
| `conventional` | Conventional | C |

`RiasecScores` requires a 0–100 score for every dimension. A `RiasecProfile` contains the six scores, an ordered top three, a three-letter Holland-style code, user-friendly labels, and an evidence label. Equal scores use the stable R-I-A-S-E-C order, making results deterministic. For example, equal Investigative and Artistic scores place Investigative first because I precedes A in the stable order.

`ProgramRiasecWeights` links one existing `ProgramId` to exactly six weights totaling 100. All 14 current programs have one explicit mapping. Validation rejects unknown or duplicate programs, missing or extra dimensions, out-of-range values, incorrect totals, and changes to the stable dimension order.

These mappings are project-model assumptions. They are not official SIBAU weightages, were not supplied or endorsed by O*NET, and require review by faculty and career-guidance experts. They are not connected to `StudentProfile`, active interest scoring, or recommendation results yet.

## Quick Guidance interest assessment

Quick Guidance contains exactly five scenarios: School project, Free afternoon, Team role, Problem to solve, and Future workday. Every scenario has one original project-designed choice for each RIASEC dimension. A response stores the scenario ID plus three different choice IDs for most preferred, second preferred, and least preferred.

| Structure | Purpose |
| --- | --- |
| `QuickInterestScenario` | Stable scenario ID, title, question, order, and exactly six choices. |
| `QuickInterestChoice` | Stable choice ID, RIASEC dimension, statement, and order. |
| `QuickInterestResponse` | Scenario plus most, second, and least choice IDs. |
| `QuickInterestAssessmentResult` | Raw totals, normalized six-dimension scores, preliminary profile, coverage, errors, and validity. |

The validator rejects unknown scenarios or choices, choices from another scenario, duplicate scenario responses, repeated preferences, missing positions, incomplete coverage, and malformed data. Complete results use the existing deterministic R-I-A-S-E-C tie order to create the top three and three-letter code.

Quick RIASEC scores are review-only. They do not replace `StudentProfile.interestScores` or enter recommendation scoring yet. The activity is not the official O*NET Interest Profiler or a validated psychometric assessment.

## Detailed Guidance interest assessment

Detailed Guidance contains exactly 30 original activity-preference questions: five each for Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. Responses use a typed 1â€“5 scale from Strongly Dislike through Strongly Like.

| Structure | Purpose |
| --- | --- |
| `DetailedRiasecQuestion` | Stable question ID, activity statement, RIASEC dimension, and sequential display order. |
| `DetailedRiasecResponse` | Question ID and a whole-number response from 1 to 5. |
| `DetailedRiasecValidationResult` | Valid responses, missing IDs, structured errors, completeness, and validity. |
| `DetailedRiasecAssessmentResult` | Six scores, profile, explanation, overall and per-dimension coverage, evidence label, and validation details. |

The validator rejects unknown or duplicate question responses, missing questions, non-integer or out-of-range values, malformed input, duplicate IDs, non-sequential orders, and any dimension without exactly five questions. Complete results use the existing deterministic R-I-A-S-E-C tie order.

Detailed RIASEC scores are review-only and use the evidence label `Stronger interest evidence`. They do not replace `StudentProfile.interestScores`, enter recommendation scoring, or activate the program RIASEC mappings. Version 1 question data and scoring remain for valid legacy session payloads and historical tests.

These questions are original project-designed items informed by RIASEC. They are not official O*NET Interest Profiler items or a validated psychometric assessment and require pilot testing and expert review.

## Recommendation session payload

After final Review confirmation, the app stores a versioned session payload containing:

| Field | Purpose |
| --- | --- |
| `version` | Payload format version used to reject incompatible data. |
| `createdAt` | ISO timestamp for the browser-session handoff. |
| `assessmentDraft` | Editable values used by **Edit My Answers**. |
| `studentProfile` | Validated, normalized profile passed to the recommendation engine. |
| `recommendationResult` | Complete engine output for the results route. |

The results route checks the payload structure, known program IDs, score ranges, eligibility/rank rules, and consistency between the draft and rebuilt profile. Invalid data produces the assessment empty state. `sessionStorage` is cleared by **Retake Assessment** and normally ends with the browser-tab session; it is not a database or a guarantee of confidentiality on a shared device.

## Subject mark

| Field | Purpose |
| --- | --- |
| `subject` | A subject the student actually studied. |
| `obtainedMarks` | Marks the student received. |
| `totalMarks` | Maximum possible marks. |
| `calculatedPercentage` | Derived percentage supplied to later eligibility and suitability logic. |

## Recommendation result

| Field | Purpose |
| --- | --- |
| `programId` | Stable ID of the evaluated program. |
| `programName` | Display name of the evaluated program. |
| `eligibilityStatus` | `Eligible`, `Not eligible`, or `Verification required`. |
| `academicScore` | Model score from available relevant subjects. |
| `interestScore` | Model score from interest dimensions. |
| `aptitudeScore` | Model score from aptitude dimensions. |
| `finalScore` | Model combination used for eligible ranking. |
| `recommendationBand` | Explainable label from Weak Match through Excellent Match, based on the final model score. |
| `confidence` | `High`, `Medium`, or `Low` model confidence based on alignment and available evidence. |
| `evidenceCoverage` | Fraction from 0 to 1 showing how much program-weighted evidence was available across the three components. |
| `rank` | Numeric rank for an eligible program; `null` for other eligibility states. |
| `reasons` | Plain-language reasons supporting the result. |
| `improvementAreas` | Preparation areas that do not override hard eligibility. |

All these scores and weights are model assumptions, not official Sukkur IBA University admission weightages.

## Validation rules for imported knowledge-base data

- Program IDs are non-empty and unique.
- Source URLs are preserved and syntactically valid when they are URLs.
- Last-verified dates use `YYYY-MM-DD`.
- Every program has an eligibility note and evidence classification.
- Each academic, aptitude, and interest weight group totals 100, as the current workbook validation sheet expects.
- Thresholds are numeric and between 0 and 100.
- Required subjects are not inferred from nonzero model weights.
- Uncertain or conflicting evidence produces `verification_required` metadata.

## Current workbook coverage

The knowledge base contains 14 program rows and test/validation worksheets. Associate Degree in Physical Education & Sports Sciences is present even though the main purpose refers to undergraduate degree recommendations; whether it belongs in the final MVP result set is an unresolved scope decision.
