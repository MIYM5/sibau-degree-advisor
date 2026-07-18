import type { Metadata } from "next";

import { ResultsPage } from "@/components/results/results-page";

export const metadata: Metadata = {
  title: "Your Recommendations | SIBAU Degree Advisor",
  description:
    "Review eligible, verification-required, and not-eligible Sukkur IBA program guidance from your completed assessment.",
};

export default function ResultsRoute() {
  return <ResultsPage />;
}
