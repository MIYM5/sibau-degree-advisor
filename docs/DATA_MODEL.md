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

The first MVP should keep this object in memory only. The `name` field is used for the current guided experience but must not be persisted or logged.

| Field | Purpose |
| --- | --- |
| `name` | Student-provided display name used only in the in-memory session. |
| `intermediateGroup` | Student's completed Intermediate/F.Sc group. |
| `subjectMarks` | List of marks for subjects actually studied. Missing subjects are omitted rather than recorded as zero. |
| `interestScores` | Scores mapped to defined interest dimensions. |
| `aptitudeScores` | Self-assessment scores mapped to defined aptitude dimensions. |

Do not persist names or include CNIC numbers, phone numbers, email addresses, roll numbers, or marks-sheet images in the first MVP.

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
