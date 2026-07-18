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
- If none of a program's academically weighted subjects has a valid mark, use a neutral 50-point placeholder and zero academic evidence coverage. This avoids both division by zero and silently treating an unstudied subject as zero.

### Interest suitability

Convert the student's self-assessment responses to a consistent 0–100 scale, then calculate:

```text
InterestScore = sum(interest dimension score × applicable program weight)
                / sum(applicable program weights)
```

Missing or out-of-range responses are omitted rather than clamped or treated as zero. The remaining valid weights are re-normalized. If no valid weighted response is available, use a neutral 50-point placeholder with zero evidence coverage.

The MVP interest assessment uses two statements for each of the 11 interest dimensions. Each response is mapped before averaging within its dimension:

- 1 (Strongly Disagree) = 0
- 2 (Disagree) = 25
- 3 (Neutral) = 50
- 4 (Agree) = 75
- 5 (Strongly Agree) = 100

Dimension evidence coverage is the number of valid responses divided by the two expected responses. The assessment flow requires all 22 responses before review. These questions and mappings are recommendation-model assumptions, not an official or psychometric assessment.

### Aptitude suitability

Convert self-assessment responses to a consistent 0–100 scale, then calculate:

```text
AptitudeScore = sum(aptitude dimension score × applicable program weight)
                / sum(applicable program weights)
```

The aptitude section is a self-assessment, not a clinical, psychometric, or official admissions test. Missing and out-of-range responses follow the same handling as interest responses.

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
- Show the top five Eligible programs.
- Do not include Verification required programs in the eligible rank.
- Do not hide Not eligible programs; explain them separately.
- Exact ties use program name and then program ID as deterministic tie-breakers.
- Retain full numeric precision internally; round only in displays and test reporting.

## Recommendation bands

- 85 to 100: Excellent Match
- 75 to below 85: Strong Match
- 65 to below 75: Good Match
- 55 to below 65: Moderate Match
- Below 55: Weak Match

These labels describe model suitability only. They do not imply admission likelihood.

## Confidence

Confidence is a recommendation-model assumption based on component alignment and evidence coverage:

- Evidence coverage combines academic, interest, and aptitude coverage using the same 50/30/20 component proportions as the final score.
- Coverage below 65% produces Low confidence.
- If the range between all three component scores is at most 12.5 points, confidence is High.
- If at least two component scores are within 12.5 points, confidence is Medium.
- Otherwise confidence is Low.
- A broadly undifferentiated profile is Low confidence when its valid interest responses span at most 30 points and its valid aptitude responses span at most 25 points.

The last rule prevents a flat self-assessment from being presented as a strong directional signal. These thresholds are transparent MVP assumptions, not validated psychometric standards.

## Institutional-fit warning

A high score among available programs does not mean the institution offers a genuinely close match. The interface should present available programs as alternatives when appropriate rather than forcing a misleading “best match.”

The MVP adds a warning when:

- a Pre-Medical profile has Biology of at least 80 and an average of at least 65 across Sports/Fitness Interest and Teaching Interest, because the current knowledge base contains no medical or clinical program;
- the highest Eligible score is below 55;
- the highest Eligible result has less than 65% combined evidence coverage; or
- no program receives an Eligible result.

These warning triggers are model assumptions and do not diagnose a student's interests or abilities.

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
