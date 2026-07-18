# SIBAU Degree Advisor

SIBAU Degree Advisor is an independent web application project that will help prospective undergraduate students explore programs offered by Sukkur IBA University. Recommendations will consider a student's Intermediate group, subject marks, verified eligibility rules, academic suitability, interests, and aptitude self-assessment.

> SIBAU Degree Advisor is not an official Sukkur IBA University admissions system. Its recommendations provide guidance only and do not guarantee eligibility, selection, or admission. Applicants must confirm requirements in the current Sukkur IBA University admission advertisement and follow the university's official admissions process.

## Current status

The repository contains the approved documentation foundation, the Excel knowledge base, typed program data, validated eligibility and recommendation engines, and the first responsive frontend flow. The landing page and academic assessment steps are available; interest, aptitude, and recommendation-result screens remain future work.

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

Open [http://localhost:3000](http://localhost:3000) in your browser. The main page is located at `src/app/page.tsx`.

Run project checks:

```bash
npm run lint
npm run build
```

## License

No license has been selected yet. Until a license is added, normal copyright rules apply.
