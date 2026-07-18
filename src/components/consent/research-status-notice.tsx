import Link from "next/link";

import { getResearchGovernanceStatus } from "@/lib/research-governance";

const statusStyles = {
  guidance_only: "border-amber-200 bg-amber-50 text-amber-950",
  adult_research_ready: "border-sky-200 bg-sky-50 text-sky-950",
  minor_research_ready: "border-teal-200 bg-teal-50 text-teal-950",
} as const;

export function ResearchStatusNotice() {
  const governance = getResearchGovernanceStatus();

  return (
    <aside
      className={`rounded-2xl border p-5 text-sm leading-6 ${statusStyles[governance.status]}`}
      aria-labelledby="research-status-heading"
    >
      <p
        id="research-status-heading"
        className="font-bold uppercase tracking-[0.12em]"
      >
        Current research-data status
      </p>
      {governance.status === "guidance_only" && (
        <>
          <p className="mt-2">
            Research data collection is currently disabled. You may still use the
            educational guidance assessment. Optional research preferences are
            recorded only temporarily in this browser session.
          </p>
          <p className="mt-2">
            Research records for participants under 18 are not being permanently
            collected.
          </p>
        </>
      )}
      {governance.status === "adult_research_ready" && (
        <>
          <p className="mt-2">
            Permanent research data collection is enabled only for eligible adult
            participants who voluntarily provide research consent.
          </p>
          <p className="mt-2">
            Research records for participants under 18 are not being permanently
            collected.
          </p>
        </>
      )}
      {governance.status === "minor_research_ready" && (
        <>
          <p className="mt-2">
            Permanent research data collection is enabled only for eligible adult
            participants who voluntarily provide research consent.
          </p>
          <p className="mt-2">
            The administrative configuration reports minor research readiness. An
            approved participant-specific guardian-consent and minor-assent
            procedure must still be completed before any minor record could be
            stored. Configuration values alone do not prove ethics approval or
            participant eligibility.
          </p>
        </>
      )}
      <Link
        href="/research-information"
        className="mt-3 inline-flex font-bold underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
      >
        View research information and safeguards
      </Link>
    </aside>
  );
}
