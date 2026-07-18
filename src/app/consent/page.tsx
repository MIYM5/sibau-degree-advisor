import type { Metadata } from "next";

import { ConsentForm } from "@/components/consent/consent-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy and Consent | SIBAU Degree Advisor",
  description:
    "Review age-group, privacy, operational consent, and voluntary research choices before starting SIBAU Degree Advisor.",
};

export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />
      <div className="assessment-backdrop px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <div className="mx-auto w-full max-w-5xl">
          <ConsentForm />
        </div>
      </div>
    </main>
  );
}
