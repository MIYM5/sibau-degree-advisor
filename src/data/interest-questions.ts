import type { InterestDimension } from "../types/program";

export type InterestResponseValue = 1 | 2 | 3 | 4 | 5;

export interface InterestQuestion {
  id: string;
  statement: string;
  dimension: InterestDimension;
  displayOrder: number;
}

export const interestDimensionLabels: Record<InterestDimension, string> = {
  "Coding Interest": "Coding",
  "Technology Interest": "Technology",
  "Problem Solving Interest": "Problem Solving",
  "Business Interest": "Business",
  "Agriculture Interest": "Agriculture",
  "Finance Interest": "Finance",
  "Media/Creative Interest": "Media and Creativity",
  "Teaching Interest": "Teaching",
  "Sports/Fitness Interest": "Sports and Fitness",
  "Engineering/Hardware Interest": "Engineering and Hardware",
  "Mathematics/Research Interest": "Mathematics and Research",
};

export const interestQuestions = [
  {
    id: "interest-coding-1",
    statement: "I enjoy giving step-by-step instructions to make something work.",
    dimension: "Coding Interest",
    displayOrder: 1,
  },
  {
    id: "interest-coding-2",
    statement: "I like finding and fixing mistakes in digital tasks.",
    dimension: "Coding Interest",
    displayOrder: 2,
  },
  {
    id: "interest-technology-1",
    statement: "I am curious about how new digital tools work.",
    dimension: "Technology Interest",
    displayOrder: 3,
  },
  {
    id: "interest-technology-2",
    statement: "I enjoy learning to use unfamiliar technology.",
    dimension: "Technology Interest",
    displayOrder: 4,
  },
  {
    id: "interest-problem-solving-1",
    statement: "I like breaking a difficult problem into smaller parts.",
    dimension: "Problem Solving Interest",
    displayOrder: 5,
  },
  {
    id: "interest-problem-solving-2",
    statement: "I stay interested when a task needs several attempts.",
    dimension: "Problem Solving Interest",
    displayOrder: 6,
  },
  {
    id: "interest-business-1",
    statement: "I enjoy thinking about how an idea can serve customers.",
    dimension: "Business Interest",
    displayOrder: 7,
  },
  {
    id: "interest-business-2",
    statement: "I like organizing resources to reach a practical goal.",
    dimension: "Business Interest",
    displayOrder: 8,
  },
  {
    id: "interest-agriculture-1",
    statement: "I am interested in how food and crops are produced.",
    dimension: "Agriculture Interest",
    displayOrder: 9,
  },
  {
    id: "interest-agriculture-2",
    statement: "I enjoy learning how land, water, and farming can be improved.",
    dimension: "Agriculture Interest",
    displayOrder: 10,
  },
  {
    id: "interest-finance-1",
    statement: "I like comparing costs, savings, and value.",
    dimension: "Finance Interest",
    displayOrder: 11,
  },
  {
    id: "interest-finance-2",
    statement: "I enjoy making sense of money-related information.",
    dimension: "Finance Interest",
    displayOrder: 12,
  },
  {
    id: "interest-media-1",
    statement: "I enjoy expressing ideas through words, visuals, or audio.",
    dimension: "Media/Creative Interest",
    displayOrder: 13,
  },
  {
    id: "interest-media-2",
    statement: "I like creating content that communicates a clear message.",
    dimension: "Media/Creative Interest",
    displayOrder: 14,
  },
  {
    id: "interest-teaching-1",
    statement: "I enjoy helping someone understand a new idea.",
    dimension: "Teaching Interest",
    displayOrder: 15,
  },
  {
    id: "interest-teaching-2",
    statement: "I like explaining information in different ways.",
    dimension: "Teaching Interest",
    displayOrder: 16,
  },
  {
    id: "interest-sports-1",
    statement: "I enjoy activities that involve movement and physical effort.",
    dimension: "Sports/Fitness Interest",
    displayOrder: 17,
  },
  {
    id: "interest-sports-2",
    statement: "I am interested in how practice and fitness improve performance.",
    dimension: "Sports/Fitness Interest",
    displayOrder: 18,
  },
  {
    id: "interest-engineering-1",
    statement: "I like understanding how machines and devices fit together.",
    dimension: "Engineering/Hardware Interest",
    displayOrder: 19,
  },
  {
    id: "interest-engineering-2",
    statement: "I enjoy practical tasks that involve building, testing, or improving things.",
    dimension: "Engineering/Hardware Interest",
    displayOrder: 20,
  },
  {
    id: "interest-mathematics-1",
    statement: "I enjoy noticing patterns and relationships in numbers.",
    dimension: "Mathematics/Research Interest",
    displayOrder: 21,
  },
  {
    id: "interest-mathematics-2",
    statement: "I like exploring why a mathematical method works.",
    dimension: "Mathematics/Research Interest",
    displayOrder: 22,
  },
] as const satisfies readonly InterestQuestion[];

export type InterestQuestionId = (typeof interestQuestions)[number]["id"];

export const interestDimensionOrder = [
  "Coding Interest",
  "Technology Interest",
  "Problem Solving Interest",
  "Business Interest",
  "Agriculture Interest",
  "Finance Interest",
  "Media/Creative Interest",
  "Teaching Interest",
  "Sports/Fitness Interest",
  "Engineering/Hardware Interest",
  "Mathematics/Research Interest",
] as const satisfies readonly InterestDimension[];
