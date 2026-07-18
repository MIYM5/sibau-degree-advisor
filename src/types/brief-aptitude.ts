export const briefAptitudeDimensionOrder = [
  "numerical",
  "logical",
  "verbal",
  "spatial-technical",
  "data-interpretation",
] as const;

export type BriefAptitudeDimension =
  (typeof briefAptitudeDimensionOrder)[number];
export type BriefAptitudeTaskId =
  | "brief-numerical"
  | "brief-logical"
  | "brief-verbal"
  | "brief-spatial-technical"
  | "brief-data-interpretation";
export type BriefAptitudeChoiceLabel = "A" | "B" | "C" | "D";
export type BriefAptitudeChoiceId =
  `${BriefAptitudeTaskId}-${BriefAptitudeChoiceLabel}`;

export interface BriefAptitudeChoice {
  id: BriefAptitudeChoiceId;
  label: BriefAptitudeChoiceLabel;
  text: string;
  displayOrder: number;
}

export type BriefAptitudeChoiceTuple = readonly [
  BriefAptitudeChoice,
  BriefAptitudeChoice,
  BriefAptitudeChoice,
  BriefAptitudeChoice,
];

export interface BriefAptitudeTask {
  id: BriefAptitudeTaskId;
  title: string;
  question: string;
  dimension: BriefAptitudeDimension;
  displayOrder: number;
  choices: BriefAptitudeChoiceTuple;
}

export interface BriefAptitudeResponse {
  taskId: BriefAptitudeTaskId;
  selectedChoiceId: BriefAptitudeChoiceId;
}

export type BriefAptitudeValidationCode =
  | "malformed_responses"
  | "malformed_response"
  | "unknown_task"
  | "unknown_choice"
  | "choice_not_in_task"
  | "duplicate_task_response"
  | "missing_task"
  | "invalid_task_configuration";

export interface BriefAptitudeValidationError {
  code: BriefAptitudeValidationCode;
  message: string;
  taskId?: string;
}

export interface BriefAptitudeValidationResult {
  responses: BriefAptitudeResponse[];
  missingTaskIds: BriefAptitudeTaskId[];
  errors: BriefAptitudeValidationError[];
  isComplete: boolean;
  isValid: boolean;
}

export interface BriefAptitudeTaskResult {
  taskId: BriefAptitudeTaskId;
  taskTitle: string;
  dimension: BriefAptitudeDimension;
  selectedChoiceId: BriefAptitudeChoiceId;
  isCorrect: boolean;
}

export interface BriefAptitudeEvidenceCoverage {
  answeredTasks: number;
  totalTasks: number;
  percentageCoverage: number;
}

export interface BriefAptitudeAssessmentResult {
  responses: BriefAptitudeResponse[];
  taskResults: BriefAptitudeTaskResult[];
  totalCorrect: number;
  totalTasks: number;
  overallPercentage: number;
  evidenceCoverage: BriefAptitudeEvidenceCoverage;
  confidenceLabel: "Limited";
  missingTaskIds: BriefAptitudeTaskId[];
  errors: BriefAptitudeValidationError[];
  isComplete: boolean;
  isValid: boolean;
}
