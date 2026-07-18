import type { Metadata } from "next";
import Link from "next/link";

import { ResearchStatusNotice } from "@/components/consent/research-status-notice";
import { SiteHeader } from "@/components/site-header";
import {
  getResearchGovernanceStatus,
  toPublicResearchGovernanceStatus,
} from "@/lib/research-governance";

export const metadata: Metadata = {
  title: "Research Information | SIBAU Degree Advisor",
  description:
    "Current research-data status, governance safeguards, contacts, retention, and participation information for SIBAU Degree Advisor.",
};

export const dynamic = "force-dynamic";

function display(value: string | number | null): string {
  return value === null ? "Not yet configured" : String(value);
}

export default function ResearchInformationPage() {
  const governance = toPublicResearchGovernanceStatus(
    getResearchGovernanceStatus(),
  );
  const details = [
    ["Responsible researcher", display(governance.responsibleResearcher)],
    ["Ethics committee", display(governance.ethicsCommitteeName)],
    ["Ethics approval reference", display(governance.ethicsApprovalReference)],
    ["Research contact", display(governance.researchContactEmail)],
    ["Privacy contact", display(governance.privacyContactEmail)],
    [
      "Permanent research retention",
      governance.retentionYears === null
        ? "Not yet configured"
        : `${governance.retentionYears} year${governance.retentionYears === 1 ? "" : "s"}`,
    ],
    ["Withdrawal procedure", display(governance.withdrawalUrl)],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />
      <header className="border-b border-slate-200 bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">
            Research governance
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Research Information
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This page explains whether permanent research collection is enabled
            and which safeguards must apply. Educational guidance remains separate
            from voluntary research participation.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 px-5 py-10 sm:px-8 sm:py-14">
        <ResearchStatusNotice />

        <section aria-labelledby="purpose-heading">
          <h2 id="purpose-heading" className="font-serif text-3xl font-bold">
            Project and research purpose
          </h2>
          <div className="mt-4 space-y-3 leading-7 text-slate-600">
            <p>
              SIBAU Degree Advisor is an independent educational guidance project,
              not an official Sukkur IBA admissions system. Recommendations do not
              guarantee eligibility, selection, or admission.
            </p>
            <p>
              Any separately approved research stage may study de-identified
              assessment responses, recommendations, and optional feedback to
              evaluate and improve the guidance model. Participation is voluntary;
              refusing research consent does not block guidance or change results.
            </p>
          </div>
        </section>

        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="font-serif text-3xl font-bold">
            Current administrative information
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Environment configuration is an administrative safety gate. It does
            not itself prove that an ethics committee approved the study, that the
            displayed information is authentic, or that a participant completed a
            required consent procedure.
          </p>
          <dl className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {details.map(([term, value]) => (
              <div key={term} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr] sm:gap-5 sm:p-5">
                <dt className="font-bold text-slate-950">{term}</dt>
                <dd className="break-words text-slate-600">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="safeguards-heading">
          <h2 id="safeguards-heading" className="font-serif text-3xl font-bold">
            Participation and safeguards
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-slate-600">
            <li>Operational consent permits only the processing needed for educational guidance.</li>
            <li>Optional research consent alone never activates permanent storage.</li>
            <li>De-identification reduces risk but cannot guarantee anonymity, especially when datasets are small or combined with other information.</li>
            <li>Future reports or publications must use approved, appropriately de-identified data and must not promise that re-identification is impossible.</li>
            <li>Withdrawal may be limited after data has been irreversibly de-identified, aggregated, or included in a publication; the approved procedure must explain those limits.</li>
            <li>Current code adds no database, analytics, cookies, trackers, or permanent research-storage operation.</li>
          </ul>
        </section>

        <section aria-labelledby="minor-heading">
          <h2 id="minor-heading" className="font-serif text-3xl font-bold">
            Participants under 18
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Current minor research status: {governance.minorResearchProcessApproved ? "administrative configuration reports readiness, but participant-specific guardian permission and minor assent still require evidence" : "not approved for permanent collection"}. Minors may still use educational guidance. A minor&apos;s checkbox alone is never sufficient research consent.
          </p>
        </section>

        <nav className="flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row" aria-label="Research information links">
          <Link href="/privacy" className="secondary-button text-center">Read the Privacy Notice</Link>
          <Link href="/consent" className="secondary-button text-center">Review Consent Choices</Link>
          <Link href="/assessment/mode" className="primary-button text-center">Choose Assessment Mode</Link>
        </nav>
      </div>
    </main>
  );
}
