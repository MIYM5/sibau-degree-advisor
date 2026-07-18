export type AssessmentMode = "quick" | "detailed";

export interface AssessmentModeMetadata {
  id: AssessmentMode;
  title: string;
  description: string;
  estimatedMinutes: {
    minimum: number;
    maximum: number;
  };
  interestQuestionCount: number;
  aptitudeQuestionCount: number;
  evidenceLabel: string;
}

export const assessmentModeMetadata = {
  quick: {
    id: "quick",
    title: "Quick Guidance",
    description:
      "A shorter starting point for students who want preliminary direction.",
    estimatedMinutes: { minimum: 3, maximum: 5 },
    interestQuestionCount: 5,
    aptitudeQuestionCount: 5,
    evidenceLabel: "Preliminary guidance",
  },
  detailed: {
    id: "detailed",
    title: "Detailed Guidance",
    description:
      "A longer option designed to provide stronger evidence about your interests.",
    estimatedMinutes: { minimum: 10, maximum: 15 },
    interestQuestionCount: 30,
    aptitudeQuestionCount: 5,
    evidenceLabel: "Stronger interest evidence",
  },
} as const satisfies Record<AssessmentMode, AssessmentModeMetadata>;

export function getAssessmentModeTotalQuestionCount(
  mode: AssessmentModeMetadata,
): number {
  return mode.interestQuestionCount + mode.aptitudeQuestionCount;
}
