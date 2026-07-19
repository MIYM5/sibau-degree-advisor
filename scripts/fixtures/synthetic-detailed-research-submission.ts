import { detailedRiasecQuestions } from "../../src/data/detailed-riasec-questions";
import type { DetailedResearchSubmission } from "../../src/types/research-submission";
import {
  createSyntheticResearchSubmission,
  type SyntheticResearchFixtureOptions,
} from "./synthetic-quick-research-submission";

/** Adult-only synthetic Detailed Guidance data for local integration testing. */
export function createSyntheticDetailedResearchSubmission(
  options?: SyntheticResearchFixtureOptions,
): DetailedResearchSubmission {
  const responses = detailedRiasecQuestions.map((question) => ({
    questionId: question.id,
    value: 4 as const,
  }));

  return createSyntheticResearchSubmission("detailed", responses, options);
}
