import type { Metadata } from "next";

import { ModeSelection } from "@/components/assessment/mode-selection";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Choose Assessment Mode | SIBAU Degree Advisor",
  description:
    "Choose Quick Guidance or Detailed Guidance before starting the SIBAU Degree Advisor assessment.",
};

export default function AssessmentModePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader compact />
      <div className="assessment-backdrop px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-18">
        <ModeSelection />
      </div>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-sm leading-6 text-slate-500">
        SIBAU Degree Advisor is an independent guidance project. It is not an
        official Sukkur IBA admissions system.
      </footer>
    </main>
  );
}
