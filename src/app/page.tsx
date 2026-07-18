import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const recommendationFactors = [
  {
    number: "01",
    title: "Academic marks",
    description: "Your studied subjects and percentages shape academic suitability.",
  },
  {
    number: "02",
    title: "Eligibility",
    description: "Program requirements are checked before any recommendation is ranked.",
  },
  {
    number: "03",
    title: "Interests",
    description: "Your preferred activities and fields help identify meaningful matches.",
  },
  {
    number: "04",
    title: "Aptitude",
    description: "A self-assessment adds another perspective to your academic profile.",
  },
] as const;

const processSteps = [
  "Enter your academic information",
  "Complete interest and aptitude assessment",
  "Receive ranked recommendations",
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />

      <section className="hero-grid relative overflow-hidden border-b border-slate-200">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-800 shadow-sm">
              <span className="size-2 rounded-full bg-teal-600" aria-hidden="true" />
              Undergraduate guidance, made clearer
            </div>
            <h1 className="mt-7 max-w-4xl font-serif text-5xl font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Find the Sukkur IBA Degree Program That Fits You
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Build a clearer shortlist using your academic marks, program
              eligibility, interests, and aptitude self-assessment—all through a
              transparent, guidance-first process.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/assessment/mode" className="primary-button text-base">
                Start Assessment
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
              <p className="max-w-xs text-sm leading-6 text-slate-500">
                No account required. Your information stays in the current
                browser session. You will review privacy and consent choices
                before the assessment starts.
              </p>
            </div>
          </div>

          <aside className="relative mx-auto w-full max-w-lg lg:ml-auto" aria-label="Assessment overview">
            <div className="absolute -inset-4 rotate-2 rounded-[2rem] bg-teal-100/70" aria-hidden="true" />
            <div className="relative rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                    Your assessment
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    Four perspectives, one shortlist
                  </h2>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-900 font-serif text-xl font-bold text-white">
                  4
                </span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {recommendationFactors.map((factor) => (
                  <div key={factor.title} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
                    <span className="font-mono text-xs font-bold text-teal-700">
                      {factor.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{factor.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">
              How it works
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              From academic profile to informed options
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-slate-700 bg-slate-900 p-6 transition hover:border-teal-500"
              >
                <span className="grid size-10 place-items-center rounded-full bg-teal-400 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-lg font-bold leading-7">{step}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {index === 0
                    ? "Choose your Intermediate group and enter marks for subjects you actually studied."
                    : index === 1
                      ? "Reflect on the activities, fields, and ways of thinking that feel most natural to you."
                      : "Compare eligible programs with clear component scores, reasons, and confidence."}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-18 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-800">
              Independent-project disclaimer
            </p>
            <h2 className="mt-2 text-xl font-bold text-amber-950">
              Guidance for exploration—not an admission decision
            </h2>
            <p className="mt-3 leading-7 text-amber-900">
              SIBAU Degree Advisor is an independent project and is not an
              official Sukkur IBA admissions system. Recommendations provide
              guidance and do not guarantee eligibility, selection, or admission.
              Always verify requirements in the current university admission
              advertisement.
            </p>
          </div>
          <Link
            href="/assessment/mode"
            className="secondary-button shrink-0 border-amber-300 bg-white text-amber-950 hover:border-amber-600"
          >
            Begin academic profile
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-700">SIBAU Degree Advisor</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="font-bold text-teal-700 underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">
              Privacy and Research Data Notice
            </Link>
            <p>Independent student guidance project</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
