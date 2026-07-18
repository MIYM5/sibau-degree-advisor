import type { Metadata } from "next";
import Link from "next/link";

import {
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_VERSION,
  privacyPolicySections,
} from "@/data/privacy-policy";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy and Research Data Notice | SIBAU Degree Advisor",
  description:
    "How SIBAU Degree Advisor temporarily processes assessment information, consent choices, results, and optional feedback.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />
      <header className="border-b border-slate-200 bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-300">
            {PRIVACY_POLICY_VERSION} · Updated {PRIVACY_POLICY_LAST_UPDATED}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy and Research Data Notice
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This notice explains the current browser-only educational guidance
            stage and identifies the legal, ethics, contact, and retention work
            still required before any permanent research collection.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          No applicant assessment data is permanently stored yet. Current data is
          held temporarily in sessionStorage in the current browser tab. This
          project is independent, has no claimed ethics or legal approval, and is
          not an official Sukkur IBA admissions service.
        </aside>

        <div className="mt-10 space-y-10">
          {privacyPolicySections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`} className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 leading-7 text-slate-600">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <Link href="/assessment/mode" className="primary-button">
            Choose Assessment Mode
          </Link>
        </div>
      </div>
    </main>
  );
}
