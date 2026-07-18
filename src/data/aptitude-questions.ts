import type { AptitudeDimension } from "../types/program";

export type AptitudeResponseValue = 1 | 2 | 3 | 4 | 5;

export interface AptitudeQuestion {
  id: string;
  statement: string;
  dimension: AptitudeDimension;
  displayOrder: number;
}

export const aptitudeDimensionLabels: Record<AptitudeDimension, string> = {
  "Logical Aptitude": "Logical",
  "Numerical Aptitude": "Numerical",
  "Verbal/Communication Aptitude": "Verbal and Communication",
  "Creative Aptitude": "Creative",
  "Spatial/Technical Aptitude": "Spatial and Technical",
  "Leadership/Social Aptitude": "Leadership and Social",
};

export const aptitudeQuestions = [
  {
    id: "aptitude-logical-1",
    statement: "I can notice when parts of an explanation do not fit together.",
    dimension: "Logical Aptitude",
    displayOrder: 1,
  },
  {
    id: "aptitude-logical-2",
    statement: "I enjoy using clues to reach a reasonable conclusion.",
    dimension: "Logical Aptitude",
    displayOrder: 2,
  },
  {
    id: "aptitude-logical-3",
    statement: "I can compare different options and explain which makes more sense.",
    dimension: "Logical Aptitude",
    displayOrder: 3,
  },
  {
    id: "aptitude-numerical-1",
    statement: "I feel comfortable working with numbers and basic calculations.",
    dimension: "Numerical Aptitude",
    displayOrder: 4,
  },
  {
    id: "aptitude-numerical-2",
    statement: "I can understand information shown in tables or simple graphs.",
    dimension: "Numerical Aptitude",
    displayOrder: 5,
  },
  {
    id: "aptitude-numerical-3",
    statement: "I like estimating quantities and checking whether an answer seems reasonable.",
    dimension: "Numerical Aptitude",
    displayOrder: 6,
  },
  {
    id: "aptitude-verbal-1",
    statement: "I can explain my ideas clearly in a conversation.",
    dimension: "Verbal/Communication Aptitude",
    displayOrder: 7,
  },
  {
    id: "aptitude-verbal-2",
    statement: "I understand the main point when I read a detailed passage.",
    dimension: "Verbal/Communication Aptitude",
    displayOrder: 8,
  },
  {
    id: "aptitude-verbal-3",
    statement: "I can adjust how I explain something for different people.",
    dimension: "Verbal/Communication Aptitude",
    displayOrder: 9,
  },
  {
    id: "aptitude-creative-1",
    statement: "I often think of more than one way to approach a task.",
    dimension: "Creative Aptitude",
    displayOrder: 10,
  },
  {
    id: "aptitude-creative-2",
    statement: "I enjoy combining familiar ideas in a new way.",
    dimension: "Creative Aptitude",
    displayOrder: 11,
  },
  {
    id: "aptitude-creative-3",
    statement: "I can imagine improvements when something feels incomplete.",
    dimension: "Creative Aptitude",
    displayOrder: 12,
  },
  {
    id: "aptitude-spatial-1",
    statement: "I can picture how parts would fit together before assembling them.",
    dimension: "Spatial/Technical Aptitude",
    displayOrder: 13,
  },
  {
    id: "aptitude-spatial-2",
    statement: "I can follow diagrams, layouts, or visual instructions.",
    dimension: "Spatial/Technical Aptitude",
    displayOrder: 14,
  },
  {
    id: "aptitude-spatial-3",
    statement: "I can understand how a simple device works by examining its parts.",
    dimension: "Spatial/Technical Aptitude",
    displayOrder: 15,
  },
  {
    id: "aptitude-leadership-1",
    statement: "I can help a group stay organized during a shared task.",
    dimension: "Leadership/Social Aptitude",
    displayOrder: 16,
  },
  {
    id: "aptitude-leadership-2",
    statement: "I listen to different views before helping a group decide.",
    dimension: "Leadership/Social Aptitude",
    displayOrder: 17,
  },
  {
    id: "aptitude-leadership-3",
    statement: "I feel comfortable supporting others when a group faces difficulty.",
    dimension: "Leadership/Social Aptitude",
    displayOrder: 18,
  },
] as const satisfies readonly AptitudeQuestion[];

export type AptitudeQuestionId = (typeof aptitudeQuestions)[number]["id"];

export const aptitudeDimensionOrder = [
  "Logical Aptitude",
  "Numerical Aptitude",
  "Verbal/Communication Aptitude",
  "Creative Aptitude",
  "Spatial/Technical Aptitude",
  "Leadership/Social Aptitude",
] as const satisfies readonly AptitudeDimension[];
