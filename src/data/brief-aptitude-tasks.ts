import type { AssessmentMode } from "../types/assessment-mode";
import type {
  BriefAptitudeDimension,
  BriefAptitudeTask,
} from "../types/brief-aptitude";

export const BRIEF_APTITUDE_DISCLAIMER =
  "This brief five-question exercise provides a limited indication of selected reasoning skills. It is not a validated psychometric test and does not provide a complete measure of aptitude.";

/**
 * Original project-written objective reasoning tasks. Correct-answer metadata
 * is intentionally kept out of this user-facing task bank.
 */
export const briefAptitudeTasks = [
  {
    id: "brief-numerical",
    title: "Numerical reasoning",
    question:
      "A student's score increases from 60 to 75. What is the percentage increase?",
    dimension: "numerical",
    displayOrder: 1,
    choices: [
      { id: "brief-numerical-A", label: "A", text: "15%", displayOrder: 1 },
      { id: "brief-numerical-B", label: "B", text: "20%", displayOrder: 2 },
      { id: "brief-numerical-C", label: "C", text: "25%", displayOrder: 3 },
      { id: "brief-numerical-D", label: "D", text: "30%", displayOrder: 4 },
    ],
  },
  {
    id: "brief-logical",
    title: "Logical reasoning",
    question: "What comes next?\n\n3, 6, 12, 24, ___",
    dimension: "logical",
    displayOrder: 2,
    choices: [
      { id: "brief-logical-A", label: "A", text: "30", displayOrder: 1 },
      { id: "brief-logical-B", label: "B", text: "36", displayOrder: 2 },
      { id: "brief-logical-C", label: "C", text: "42", displayOrder: 3 },
      { id: "brief-logical-D", label: "D", text: "48", displayOrder: 4 },
    ],
  },
  {
    id: "brief-verbal",
    title: "Verbal reasoning",
    question: "Book is to Reading as Fork is to:",
    dimension: "verbal",
    displayOrder: 3,
    choices: [
      { id: "brief-verbal-A", label: "A", text: "Cooking", displayOrder: 1 },
      { id: "brief-verbal-B", label: "B", text: "Eating", displayOrder: 2 },
      { id: "brief-verbal-C", label: "C", text: "Washing", displayOrder: 3 },
      { id: "brief-verbal-D", label: "D", text: "Drawing", displayOrder: 4 },
    ],
  },
  {
    id: "brief-spatial-technical",
    title: "Spatial and Technical reasoning",
    question:
      "A gear rotates clockwise. A second gear directly touching it will rotate:",
    dimension: "spatial-technical",
    displayOrder: 4,
    choices: [
      {
        id: "brief-spatial-technical-A",
        label: "A",
        text: "Clockwise",
        displayOrder: 1,
      },
      {
        id: "brief-spatial-technical-B",
        label: "B",
        text: "Anticlockwise",
        displayOrder: 2,
      },
      {
        id: "brief-spatial-technical-C",
        label: "C",
        text: "Upward",
        displayOrder: 3,
      },
      {
        id: "brief-spatial-technical-D",
        label: "D",
        text: "It will not rotate",
        displayOrder: 4,
      },
    ],
  },
  {
    id: "brief-data-interpretation",
    title: "Data Interpretation",
    question:
      "A class has 40 students. Ten selected Computer Science, 12 selected Business, 8 selected Engineering, and the rest selected other fields.\n\nHow many selected other fields?",
    dimension: "data-interpretation",
    displayOrder: 5,
    choices: [
      {
        id: "brief-data-interpretation-A",
        label: "A",
        text: "8",
        displayOrder: 1,
      },
      {
        id: "brief-data-interpretation-B",
        label: "B",
        text: "10",
        displayOrder: 2,
      },
      {
        id: "brief-data-interpretation-C",
        label: "C",
        text: "12",
        displayOrder: 3,
      },
      {
        id: "brief-data-interpretation-D",
        label: "D",
        text: "14",
        displayOrder: 4,
      },
    ],
  },
] as const satisfies readonly BriefAptitudeTask[];

export const briefAptitudeDimensionLabels: Record<
  BriefAptitudeDimension,
  string
> = {
  numerical: "Numerical",
  logical: "Logical",
  verbal: "Verbal",
  "spatial-technical": "Spatial and Technical",
  "data-interpretation": "Data Interpretation",
};

/** Both Version 2 modes deliberately use the same immutable task bank. */
export function getBriefAptitudeTasksForMode(
  mode: AssessmentMode,
): readonly BriefAptitudeTask[] {
  void mode;
  return briefAptitudeTasks;
}
