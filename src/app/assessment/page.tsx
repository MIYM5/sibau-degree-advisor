import type { Metadata } from "next";

import { AssessmentFlow } from "@/components/assessment/assessment-flow";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Academic Assessment | SIBAU Degree Advisor",
  description:
    "Enter and review your Intermediate group and subject marks for the SIBAU Degree Advisor assessment.",
};

export default function AssessmentPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />
      <div className="assessment-backdrop px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <AssessmentFlow />
      </div>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-sm leading-6 text-slate-500">
        SIBAU Degree Advisor is an independent guidance project. It is not an
        official Sukkur IBA admissions system.
      </footer>
    </main>
  );
}
