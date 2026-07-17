# Scoring Model

## Important distinction

The academic, interest, aptitude, final-score, and confidence calculations in SIBAU Degree Advisor are recommendation-model assumptions. They are not official Sukkur IBA University admission weightages, merit formulas, or selection criteria.

Recommendations provide guidance and do not guarantee admission.

## Order of operations

1. Evaluate hard eligibility.
2. Keep Eligible, Not eligible, and Verification required separate.
3. Calculate suitability components for explanation.
4. Rank only programs marked Eligible.
5. Show Verification required programs without an eligible rank.
6. Show Not eligible programs as alternative pathways with the failed hard rule.

A high score can never bypass a hard eligibility rule.

## Current workbook formulas

### Academic suitability

For subjects the student actually studied:

```text
AcademicScore = sum(subject percentage × program subject weight)
                / sum(applicable program subject weights)
```

The result is on a 0–100 scale.

### Missing preferred subjects

- Do not automatically enter zero for a subject the student did not study.
- Re-normalize preferred-subject weights over available studied subjects.
- Never re-normalize around a missing required subject.
- For a Pre-Medical student, missing Mathematics may lower or reduce confidence in academic suitability for some non-engineering programs, but it must not automatically change eligibility to Not eligible.

### Interest suitability

Convert the student's self-assessment responses to a consistent 0–100 scale, then calculate:

```text
InterestScore = sum(interest dimension score × program weight) / 100
```

### Aptitude suitability

Convert self-assessment responses to a consistent 0–100 scale, then calculate:

```text
AptitudeScore = sum(aptitude dimension score × program weight) / 100
```

The aptitude section is a self-assessment, not a clinical, psychometric, or official admissions test.

### Final suitability

The current workbook recommends:

```text
FinalScore = AcademicScore × 0.50
           + InterestScore × 0.30
           + AptitudeScore × 0.20
```

These 50/30/20 component weights are model assumptions. They require review with academic or career-counselling experts before production use.

## Program-specific weights

The workbook gives each program:

- academic subject weights totaling 100;
- interest dimension weights totaling 100;
- aptitude dimension weights totaling 100.

The workbook labels them “Model-defined recommendation weights.” Nonzero subject weight means relevance to suitability; it does not, by itself, create an official prerequisite.

## Ranking

- Sort Eligible programs by final score from highest to lowest.
- The workbook suggests showing the top five.
- Do not include Verification required programs in the eligible rank.
- Do not hide Not eligible programs; explain them separately.
- Use ties or near-ties to encourage comparison rather than false precision.

## Confidence

The workbook says confidence should be higher when marks, interests, and aptitude align and lower when they conflict. Exact thresholds are not yet defined.

Before implementation, decide and document:

- how component disagreement is measured;
- what counts as high, medium, or low confidence;
- how missing answers affect confidence;
- how close scores are displayed;
- when to show an institutional-fit warning.

Until those decisions are approved, confidence is an unresolved model assumption.

## Institutional-fit warning

A high score among available programs does not mean the institution offers a genuinely close match. For example, the workbook's health-oriented Pre-Medical profile is expected to receive an explicit warning because the current knowledge base contains no medical or clinical degree.

The interface should say that listed programs are alternatives rather than forcing a misleading “best match.”

## Required tests

- Strong computing profile.
- Biology and health-oriented Pre-Medical profile.
- Commerce and finance profile.
- Engineering and hardware profile.
- Pre-Medical profile with strong computing interest.
- Broad, weakly differentiated profile.
- Missing preferred Mathematics without a non-engineering eligibility failure.
- Missing hard-required subject for a restricted engineering program.
- Equal and near-equal final scores.
- Incomplete self-assessment.

## Review checklist for any weight change

- Is it labeled as a model assumption?
- Is the reason documented in `DECISIONS.md`?
- Did eligibility behavior remain separate?
- Were relevant test profiles rerun?
- Did the explanation change in a way users can understand?
- Could the new value imply more precision or certainty than the evidence supports?
