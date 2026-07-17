# Data Model

This document describes the concepts SIBAU Degree Advisor needs. Field names are illustrative until the Next.js and TypeScript foundation is approved.

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
| `description` | Short, neutral program summary. |
| `careerOptions` | Illustrative career directions, not job guarantees. |
| `eligibilityRule` | Reference to structured hard-rule data. |
| `academicWeights` | Model-assumption weights by subject. |
| `interestWeights` | Model-assumption weights by interest dimension. |
| `aptitudeWeights` | Model-assumption weights by aptitude dimension. |
| `evidence` | Source URL, verified date, admission year, and status. |

## Eligibility rule

| Field | Purpose |
| --- | --- |
| `classification` | `confirmed_official`, `working_mvp`, or `verification_required`. |
| `allowedGroups` | Groups explicitly allowed by the selected rule. |
| `requiredSubjects` | Subjects that are hard requirements, when supported. |
| `minimumSubjectPercentage` | Hard subject threshold, if supported. |
| `minimumOverallPercentage` | Hard overall threshold, if supported. |
| `notes` | Human-readable limits, conflicts, or exceptions. |
| `evidenceIds` | Links to one or more evidence records. |

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

The first MVP should keep this object in memory only.

| Field | Purpose |
| --- | --- |
| `intermediateGroup` | Student's completed Intermediate/F.Sc group. |
| `overallPercentage` | Optional normalized overall percentage if collected. |
| `subjectMarks` | Map of studied subjects to percentages. Missing means not studied or not supplied. |
| `interestResponses` | Answers mapped to defined interest dimensions. |
| `aptitudeResponses` | Self-assessment answers mapped to defined aptitude dimensions. |
| `consentAcknowledgements` | Confirmation that guidance and privacy notices were read, if needed. |

Do not include names, CNIC numbers, phone numbers, email addresses, roll numbers, or marks-sheet images in the first MVP.

## Eligibility result

| Field | Purpose |
| --- | --- |
| `status` | `eligible`, `not_eligible`, or `verification_required`. |
| `reasonCodes` | Stable codes for tests and explanations. |
| `explanation` | Plain-language result. |
| `failedRequirements` | Hard rules that were not met. |
| `evidence` | Sources and verification dates used. |
| `warnings` | Conflicts, current-advertisement checks, or missing data. |

## Suitability result

| Field | Purpose |
| --- | --- |
| `academicScore` | Model score from available relevant subjects. |
| `interestScore` | Model score from interest dimensions. |
| `aptitudeScore` | Model score from aptitude dimensions. |
| `finalScore` | Model combination used for eligible ranking. |
| `confidence` | Model estimate such as high, medium, or low. |
| `strengths` | Main positive contributors. |
| `gaps` | Preparation gaps that do not change eligibility unless they are hard requirements. |

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
