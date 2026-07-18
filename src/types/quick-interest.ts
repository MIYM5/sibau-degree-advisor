import type {
  RiasecDimension,
  RiasecProfile,
  RiasecScores,
} from "./riasec";

export type QuickInterestScenarioId =
  | "school-project"
  | "free-afternoon"
  | "team-role"
  | "problem-to-solve"
  | "future-workday";

export type QuickInterestChoiceId =
  `${QuickInterestScenarioId}-${RiasecDimension}`;

export interface QuickInterestChoice {
  id: QuickInterestChoiceId;
  dimension: RiasecDimension;
  statement: string;
  displayOrder: number;
}

export type QuickInterestChoiceTuple = readonly [
  QuickInterestChoice,
  QuickInterestChoice,
  QuickInterestChoice,
  QuickInterestChoice,
  QuickInterestChoice,
  QuickInterestChoice,
];

export interface QuickInterestScenario {
  id: QuickInterestScenarioId;
  title: string;
  question: string;
  displayOrder: number;
  choices: QuickInterestChoiceTuple;
}

export interface QuickInterestResponse {
  scenarioId: QuickInterestScenarioId;
  mostPreferredChoiceId: QuickInterestChoiceId;
  secondPreferredChoiceId: QuickInterestChoiceId;
  leastPreferredChoiceId: QuickInterestChoiceId;
}

export interface QuickInterestResponseDraft {
  scenarioId: QuickInterestScenarioId;
  mostPreferredChoiceId?: QuickInterestChoiceId;
  secondPreferredChoiceId?: QuickInterestChoiceId;
  leastPreferredChoiceId?: QuickInterestChoiceId;
}

export type QuickInterestValidationCode =
  | "malformed_responses"
  | "malformed_response"
  | "unknown_scenario"
  | "duplicate_scenario_response"
  | "missing_preference"
  | "unknown_choice"
  | "choice_not_in_scenario"
  | "duplicate_preference"
  | "missing_scenario";

export interface QuickInterestValidationError {
  code: QuickInterestValidationCode;
  message: string;
  scenarioId?: string;
}

export interface QuickInterestAssessmentResult {
  responses: QuickInterestResponse[];
  rawScores: RiasecScores;
  scores: RiasecScores;
  profile: RiasecProfile | null;
  evidenceLabel: "Preliminary";
  completedScenarioCount: number;
  totalScenarioCount: number;
  evidenceCoverage: number;
  errors: QuickInterestValidationError[];
  isComplete: boolean;
  isValid: boolean;
}
