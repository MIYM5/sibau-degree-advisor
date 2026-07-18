import type { DetailedRiasecQuestion } from "../types/detailed-interest";

/**
 * Original project-written activity-preference items informed by RIASEC.
 * These are not official O*NET Interest Profiler items and have not been
 * validated as a psychometric instrument.
 */
export const detailedRiasecQuestions = [
  {
    id: "detailed-realistic-1",
    statement: "Assemble a small electronic or mechanical device.",
    dimension: "realistic",
    displayOrder: 1,
  },
  {
    id: "detailed-realistic-2",
    statement: "Use tools to repair something that has stopped working.",
    dimension: "realistic",
    displayOrder: 2,
  },
  {
    id: "detailed-realistic-3",
    statement: "Test equipment to find the cause of a practical problem.",
    dimension: "realistic",
    displayOrder: 3,
  },
  {
    id: "detailed-realistic-4",
    statement: "Take part in outdoor, physical, or hands-on activities.",
    dimension: "realistic",
    displayOrder: 4,
  },
  {
    id: "detailed-realistic-5",
    statement: "Build a working model from a design or set of instructions.",
    dimension: "realistic",
    displayOrder: 5,
  },
  {
    id: "detailed-investigative-1",
    statement: "Examine evidence to understand why something happened.",
    dimension: "investigative",
    displayOrder: 6,
  },
  {
    id: "detailed-investigative-2",
    statement: "Solve a difficult mathematical or scientific problem.",
    dimension: "investigative",
    displayOrder: 7,
  },
  {
    id: "detailed-investigative-3",
    statement: "Compare different explanations before reaching a conclusion.",
    dimension: "investigative",
    displayOrder: 8,
  },
  {
    id: "detailed-investigative-4",
    statement: "Conduct an experiment and interpret its results.",
    dimension: "investigative",
    displayOrder: 9,
  },
  {
    id: "detailed-investigative-5",
    statement: "Learn how a complex system or technology works.",
    dimension: "investigative",
    displayOrder: 10,
  },
  {
    id: "detailed-artistic-1",
    statement: "Create a video, poster, illustration, story, or digital design.",
    dimension: "artistic",
    displayOrder: 11,
  },
  {
    id: "detailed-artistic-2",
    statement: "Find an original way to communicate an important message.",
    dimension: "artistic",
    displayOrder: 12,
  },
  {
    id: "detailed-artistic-3",
    statement: "Develop creative content without following a fixed template.",
    dimension: "artistic",
    displayOrder: 13,
  },
  {
    id: "detailed-artistic-4",
    statement: "Express an idea through writing, visuals, music, or performance.",
    dimension: "artistic",
    displayOrder: 14,
  },
  {
    id: "detailed-artistic-5",
    statement: "Improve the appearance and emotional impact of a presentation.",
    dimension: "artistic",
    displayOrder: 15,
  },
  {
    id: "detailed-social-1",
    statement: "Explain a difficult idea to someone who needs help.",
    dimension: "social",
    displayOrder: 16,
  },
  {
    id: "detailed-social-2",
    statement: "Support a person who is facing a problem.",
    dimension: "social",
    displayOrder: 17,
  },
  {
    id: "detailed-social-3",
    statement: "Teach, coach, or guide younger students.",
    dimension: "social",
    displayOrder: 18,
  },
  {
    id: "detailed-social-4",
    statement: "Help a group cooperate and resolve disagreement.",
    dimension: "social",
    displayOrder: 19,
  },
  {
    id: "detailed-social-5",
    statement: "Take part in work that improves people's wellbeing.",
    dimension: "social",
    displayOrder: 20,
  },
  {
    id: "detailed-enterprising-1",
    statement: "Convince others to support a useful idea.",
    dimension: "enterprising",
    displayOrder: 21,
  },
  {
    id: "detailed-enterprising-2",
    statement: "Lead a team toward a challenging goal.",
    dimension: "enterprising",
    displayOrder: 22,
  },
  {
    id: "detailed-enterprising-3",
    statement: "Plan how a product, service, or event could attract people.",
    dimension: "enterprising",
    displayOrder: 23,
  },
  {
    id: "detailed-enterprising-4",
    statement: "Negotiate a solution that benefits different parties.",
    dimension: "enterprising",
    displayOrder: 24,
  },
  {
    id: "detailed-enterprising-5",
    statement: "Take responsibility for developing a new opportunity.",
    dimension: "enterprising",
    displayOrder: 25,
  },
  {
    id: "detailed-conventional-1",
    statement: "Organize records so that information can be found easily.",
    dimension: "conventional",
    displayOrder: 26,
  },
  {
    id: "detailed-conventional-2",
    statement: "Check calculations, entries, or documents for accuracy.",
    dimension: "conventional",
    displayOrder: 27,
  },
  {
    id: "detailed-conventional-3",
    statement: "Prepare a budget and monitor how money is used.",
    dimension: "conventional",
    displayOrder: 28,
  },
  {
    id: "detailed-conventional-4",
    statement: "Create a schedule and ensure tasks are completed on time.",
    dimension: "conventional",
    displayOrder: 29,
  },
  {
    id: "detailed-conventional-5",
    statement: "Work with structured information using clear rules and procedures.",
    dimension: "conventional",
    displayOrder: 30,
  },
] as const satisfies readonly DetailedRiasecQuestion[];
