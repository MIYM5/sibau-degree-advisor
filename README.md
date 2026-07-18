# SIBAU Degree Advisor

SIBAU Degree Advisor is an independent web application project that will help prospective undergraduate students explore programs offered by Sukkur IBA University. Recommendations will consider a student's Intermediate group, subject marks, verified eligibility rules, academic suitability, interests, and aptitude self-assessment.

> SIBAU Degree Advisor is not an official Sukkur IBA University admissions system. Its recommendations provide guidance only and do not guarantee eligibility, selection, or admission. Applicants must confirm requirements in the current Sukkur IBA University admission advertisement and follow the university's official admissions process.

## Current status

Version 1 remains preserved on the `main` branch and at tag `v1.0.0`. Version 2 development is taking place on the `version-2.0` branch.

The repository contains the approved documentation foundation, protected Excel knowledge base, typed program data, validated eligibility and recommendation engines, and a responsive end-to-end frontend flow. Version 2 provides **Quick Guidance** and **Detailed Guidance**, a typed six-dimension RIASEC model, explicit RIASEC mappings for all 14 programs, the five-scenario Quick Guidance activity, the 30-item Detailed Guidance assessment, and five shared objective aptitude tasks.

Version 2 evidence is now connected to mode-aware recommendations. Quick Guidance uses 55% academic suitability, 30% RIASEC alignment, and 15% brief aptitude. Detailed Guidance uses 50% academic suitability, 35% RIASEC alignment, and 15% brief aptitude. The five-task aptitude result remains labeled `Limited`; Quick confidence can never exceed Medium. Valid Version 1 sessions continue to use the original 50/30/20 model.

The results page presents eligible ranks 1â€“3 as **Top Matches** and ranks 4â€“5 as **Alternative Options**, followed by separate unranked sections for admission verification and current ineligibility. Score-gap labels compare each eligible result only with the result immediately above it. These labels are display guidance, not statistical proof, and do not change scores or ranks.

Quick and Detailed results now end with optional post-results feedback about perceived interest alignment, personal relevance, and explanation usefulness. Feedback is validated and stored only in a dedicated, versioned `sessionStorage` record. It does not recalculate or change recommendations, and it excludes the student name, contact information, exact marks, and raw assessment responses. This temporary browser storage is not a research database.

New Version 2 assessments now pass through a privacy and informed-consent screen after mode selection. The student selects an age group and grants required operational consent before assessment processing begins. Research, follow-up contact, and future analytics choices are optional, independent, and never preselected. Minor records remain ineligible for research storage until a real approved guardian-consent and institutional-review process exists. These choices are temporary, future-ready metadata only; no permanent applicant or research database has been added.

A server-only research-governance gate now defaults to `guidance_only`. It can report `adult_research_ready` only when every required adult administrative field is valid, and `minor_research_ready` only when the adult gate plus approved guardian-consent and minor-assent procedure references are configured. Configuration is not proof of legal or ethics approval, consent alone never enables storage, and no database or permanent write operation exists. Version 1 remains preserved on `main` and tag `v1.0.0`.

The Quick and Detailed interest activities and brief aptitude tasks are original project-designed content. They are not official O*NET Interest Profiler items or validated psychometric assessments and require pilot testing and expert review. The previous 18-item aptitude self-assessment and 22-item interest questionnaire remain only for compatible legacy sessions and historical tests.

RIASEC program mappings, component weights, and confidence thresholds are project-model assumptions. They are not official SIBAU weightages, were not supplied or endorsed by O*NET, and require review by faculty, career-guidance, and educational-measurement experts.

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

Open [http://localhost:3000](http://localhost:3000) in your browser. Select **Start Assessment** to open `/assessment/mode`, choose Quick or Detailed Guidance, review privacy and consent at `/consent`, and then continue to `/assessment`. The full notice is available at `/privacy`.

Current research status and non-secret administrative metadata are available at `/research-information`. With the provided `.env.example` defaults, research collection remains disabled while the complete educational guidance flow continues to work.

The selected mode, consent record, assessment draft, recommendations, optional feedback, and essential-storage-notice dismissal each use separate versioned `sessionStorage` keys. Records are temporary and scoped to the current browser tab. **Retake Assessment** clears the assessment, results, and current feedback while preserving the selected mode and valid operational consent for the same tab. Selecting a mode again resets consent and assessment progress so new Version 2 work cannot bypass the privacy screen. The MVP does not save student profiles, consent records, results, or feedback to a permanent database.

Run project checks:

```bash
npm run lint
npm run build
npm run test:integration
npm run test:riasec-data
npm run test:quick-interest
npm run test:detailed-interest
npm run test:brief-aptitude
npm run test:recommendation-v2
npm run test:recommendation-presentation
npm run test:feedback
npm run test:consent
npm run test:research-governance
```

## License

No license has been selected yet. Until a license is added, normal copyright rules apply.
