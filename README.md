# SIBAU Degree Advisor

SIBAU Degree Advisor is an independent web application project that will help prospective undergraduate students explore programs offered by Sukkur IBA University. Recommendations will consider a student's Intermediate group, subject marks, verified eligibility rules, academic suitability, interests, and aptitude self-assessment.

> SIBAU Degree Advisor is not an official Sukkur IBA University admissions system. Its recommendations provide guidance only and do not guarantee eligibility, selection, or admission. Applicants must confirm requirements in the current Sukkur IBA University admission advertisement and follow the university's official admissions process.

## Current status

Version 1 remains preserved on the `main` branch and at tag `v1.0.0`. Version 2 development is taking place on the `version-2.0` branch.

The repository contains the approved documentation foundation, the Excel knowledge base, typed program data, validated eligibility and recommendation engines, and a responsive end-to-end frontend flow. Version 2 now includes the architecture for **Quick Guidance** and **Detailed Guidance**, a typed six-dimension RIASEC model, explicit RIASEC mappings for all 14 programs, the five-scenario Quick Guidance interest activity, and the 30-item Detailed Guidance RIASEC interest assessment.

Both modes display their RIASEC scores and three-letter profile during review, but those values are not yet connected to recommendation scoring. Quick Guidance retains its approved five-scenario activity. Detailed Guidance now uses 30 original activity-preference questions, with exactly five per RIASEC dimension and a `Stronger interest evidence` label. Both modes temporarily retain the Version 1 aptitude self-assessment. The Version 1 interest questionnaire remains only for compatible legacy sessions and historical tests.

The Quick and Detailed interest activities are original project-designed items informed by RIASEC. They are not the official O*NET Interest Profiler, are not validated psychometric assessments, and require pilot testing and expert review.

RIASEC program mappings are project-model assumptions. They are not official SIBAU weightages, were not supplied or endorsed by O*NET, and require review by faculty and career-guidance experts before they influence recommendations.

## MVP principles

- Check hard eligibility before calculating or ranking suitability.
- Clearly distinguish official evidence, working MVP rules, and recommendation-model assumptions.
- Keep uncertain or conflicting criteria visible as **verification required**.
- Link users to the relevant official source whenever an eligibility result is shown.
- Treat academic, interest, and aptitude weights as project assumptions, not official university admission weightages.
- Explain recommendations in beginner-friendly language and avoid promising admission outcomes.

## Working Pre-Medical eligibility rule

For the MVP, Pre-Medical students are eligible for all Sukkur IBA undergraduate programs included in the knowledge base except:

1. BE Electrical Engineering
2. BE Computer Systems Engineering

Pre-Medical students are eligible for BS Computer Science, BS Software Engineering, BS Artificial Intelligence, BS Mathematics, business programs, economics, accounting and finance, media and communication, education, physical education, and other non-engineering programs included in the knowledge base.

Missing Mathematics may reduce academic suitability for some programs, but it must not automatically make a Pre-Medical student ineligible for any non-engineering program.

BE Electrical Engineering and BE Computer Systems Engineering use their separate restricted eligibility rules.

This is a working MVP rule, not a claim that Sukkur IBA University has published this exact rule. It must be reconciled with the current admission advertisement before production use.

## Knowledge base

The current source workbook is:

`data/SIBAU_Degree_Recommendation_Knowledge_Base_PreMedical_Updated.xlsx`

The workbook stores program information, source URLs, last-verified dates, model weights, test profiles, and validation sheets. Do not overwrite or replace it without documenting the source, verification date, and reason for the update.

## Technology

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- npm
- Git and GitHub
- Supabase later, only after a separate design decision
- Vercel later, only when deployment work begins

The current scope does not include Supabase, authentication, an external AI API, OCR, or paid services.

## Documentation

- [Product requirements](docs/PRD.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Scoring model](docs/SCORING_MODEL.md)
- [Eligibility rules](docs/ELIGIBILITY_RULES.md)
- [Decision log](docs/DECISIONS.md)
- [Task list](docs/TASKS.md)
- [Contribution guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Getting started

Requirements:

- Node.js 20.9 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Select **Start Assessment** to open `/assessment/mode`, choose Quick or Detailed Guidance, and then continue to the existing assessment at `/assessment`.

The selected mode uses its own versioned `sessionStorage` record. Assessment answers and generated recommendations continue to use their existing session records so the results page and the **Edit My Answers** action work in the same browser tab. **Retake Assessment** clears the assessment and results data while preserving the selected mode. The MVP does not save student profiles to a database or long-term browser storage.

Run project checks:

```bash
npm run lint
npm run build
npm run test:integration
npm run test:riasec-data
npm run test:quick-interest
npm run test:detailed-interest
```

## License

No license has been selected yet. Until a license is added, normal copyright rules apply.
