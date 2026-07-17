## Summary

Describe the user-facing result of this change in plain language.

## Why this change is needed

Explain the problem or task being addressed.

## Change type

- [ ] Documentation
- [ ] Application feature
- [ ] Bug fix
- [ ] Eligibility-data update
- [ ] Recommendation-model change
- [ ] Refactoring or maintenance

## Rule classification

If this pull request affects eligibility or recommendations, select every relevant category and explain the evidence below.

- [ ] Confirmed official eligibility
- [ ] Working MVP eligibility rule
- [ ] Recommendation-model assumption
- [ ] Verification required against the current admission advertisement
- [ ] Not applicable

## Sources and verification

- Program(s):
- Exact source URL(s):
- Applicable admission year:
- Last verified (`YYYY-MM-DD`):
- Evidence summary:
- Remaining uncertainty or conflict:

Do not describe a rule as official unless the cited current source supports that exact statement.

## Testing

Describe the checks performed and important cases covered.

- [ ] Existing checks pass.
- [ ] New or changed behavior has tests.
- [ ] Pre-Medical behavior was checked if relevant.
- [ ] Restricted engineering behavior was checked if relevant.
- [ ] Missing preferred subjects were not treated as missing hard requirements.
- [ ] Workbook-derived row counts, URLs, and dates were preserved if relevant.

## Screenshots

Add screenshots for visible interface changes, or write “Not applicable.” Do not include real student data.

## Documentation and safety checklist

- [ ] I used “SIBAU Degree Advisor” consistently.
- [ ] I kept official evidence, working rules, and model assumptions separate.
- [ ] I did not invent or strengthen an official eligibility rule.
- [ ] Uncertain criteria say that current-advertisement verification is required.
- [ ] Guidance does not claim to guarantee admission.
- [ ] The independent-project disclaimer remains clear.
- [ ] I did not commit secrets, `.env` files, generated folders, logs, or real student data.
- [ ] I did not add Supabase, authentication, an external AI API, OCR, or a paid service without an approved decision.

## Follow-up work

List anything intentionally left for a later pull request.
