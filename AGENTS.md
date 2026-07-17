# AGENTS.md

This file gives contributors and coding agents the project rules for SIBAU Degree Advisor. It applies to the entire repository.

## Project goal

Build a beginner-friendly web application that recommends Sukkur IBA University undergraduate programs using eligibility, academic suitability, student interests, and aptitude self-assessment.

## Non-negotiable product statements

- SIBAU Degree Advisor is an independent project and is not an official Sukkur IBA admissions system.
- Recommendations provide guidance and do not guarantee admission.
- Official eligibility evidence, working MVP rules, and model assumptions must be labeled separately.
- Never invent, strengthen, or silently resolve an official eligibility rule.
- Uncertain or conflicting criteria must say that verification against the current admission advertisement is required.
- Academic, interest, and aptitude weights are recommendation-model assumptions, not official university admission weightages.

## Working Pre-Medical eligibility rule

Use this rule exactly unless the project owner approves a documented change:

- Pre-Medical students are eligible for all Sukkur IBA undergraduate programs included in the knowledge base except:
  1. BE Electrical Engineering
  2. BE Computer Systems Engineering
- Pre-Medical students are eligible for BS Computer Science, BS Software Engineering, BS Artificial Intelligence, BS Mathematics, business programs, economics, accounting and finance, media and communication, education, physical education, and other non-engineering programs included in the knowledge base.
- Missing Mathematics may reduce academic suitability for some programs, but it must not automatically make a Pre-Medical student ineligible for any non-engineering program.
- BE Electrical Engineering and BE Computer Systems Engineering must use their separate restricted eligibility rules.

Label this as a **working MVP eligibility rule**, not confirmed official policy. Reconcile it with the active admission advertisement before production use.

## Knowledge-base protection

- Preserve `data/SIBAU_Degree_Recommendation_Knowledge_Base_PreMedical_Updated.xlsx` unless an approved task explicitly replaces it.
- Preserve every official source URL and last-verified date during imports or migrations.
- Never convert an uncertain workbook note into a confirmed official rule.
- Record the applicable admission year when it becomes available.
- Validate imported row counts, required columns, source URLs, and verification dates.

## Recommendation behavior

1. Evaluate hard eligibility first.
2. Keep “Eligible,” “Not eligible,” and “Verification required” distinct.
3. Rank only eligible programs.
4. Calculate academic, interest, and aptitude suitability only after eligibility handling.
5. Explain missing-subject treatment; do not treat an unstudied preferred subject as zero automatically.
6. Never use weight re-normalization to bypass a required subject.
7. Show official source links and a current-advertisement warning with results.
8. Show an institutional-fit warning when the available programs do not closely match a student's goals.

## Current scope boundaries

Until separately approved, do not add:

- Supabase
- authentication
- external AI APIs
- OCR
- paid services

## Development workflow

- Read `README.md`, `docs/PRD.md`, `docs/ELIGIBILITY_RULES.md`, and `docs/DECISIONS.md` before changing recommendation behavior.
- Keep changes small and document decisions that affect eligibility, scoring, data, privacy, or architecture.
- Add or update tests when eligibility or scoring logic changes.
- Do not commit secrets or real student personal data.
- Do not commit generated folders, local environment files, logs, coverage output, or editor settings.
- Use feature branches after the initial repository baseline is approved.
- Do not commit or push unless the project owner asks for it.

## Documentation style

- Use the name “SIBAU Degree Advisor” consistently.
- Write for a developer building a first full web application.
- Prefer plain language, short examples, and explicit definitions.
- When evidence is incomplete, state what is known, what is assumed, and what must be verified.
