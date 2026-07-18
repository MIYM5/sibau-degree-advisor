import type { QuickInterestScenario } from "../types/quick-interest";

/**
 * Original project-designed scenarios informed by the RIASEC framework.
 * These are not official O*NET Interest Profiler items.
 */
export const quickInterestScenarios = [
  {
    id: "school-project",
    title: "School project",
    question:
      "You are asked to choose one school project. Which activities would you prefer most, second most, and least?",
    displayOrder: 1,
    choices: [
      {
        id: "school-project-realistic",
        dimension: "realistic",
        statement: "Build or repair a small working device.",
        displayOrder: 1,
      },
      {
        id: "school-project-investigative",
        dimension: "investigative",
        statement: "Investigate why an experiment produced unexpected results.",
        displayOrder: 2,
      },
      {
        id: "school-project-artistic",
        dimension: "artistic",
        statement: "Design a poster, video, story, or presentation.",
        displayOrder: 3,
      },
      {
        id: "school-project-social",
        dimension: "social",
        statement: "Help younger students understand a difficult topic.",
        displayOrder: 4,
      },
      {
        id: "school-project-enterprising",
        dimension: "enterprising",
        statement: "Lead a team that must promote and present an idea.",
        displayOrder: 5,
      },
      {
        id: "school-project-conventional",
        dimension: "conventional",
        statement: "Organize project records, schedules, and calculations.",
        displayOrder: 6,
      },
    ],
  },
  {
    id: "free-afternoon",
    title: "Free afternoon",
    question:
      "You have a free afternoon. Which activities would you prefer most, second most, and least?",
    displayOrder: 2,
    choices: [
      {
        id: "free-afternoon-realistic",
        dimension: "realistic",
        statement: "Assemble equipment or work with tools.",
        displayOrder: 1,
      },
      {
        id: "free-afternoon-investigative",
        dimension: "investigative",
        statement: "Solve a difficult puzzle or research an interesting question.",
        displayOrder: 2,
      },
      {
        id: "free-afternoon-artistic",
        dimension: "artistic",
        statement: "Create digital art, write, photograph, or make a video.",
        displayOrder: 3,
      },
      {
        id: "free-afternoon-social",
        dimension: "social",
        statement: "Volunteer, coach, teach, or support someone.",
        displayOrder: 4,
      },
      {
        id: "free-afternoon-enterprising",
        dimension: "enterprising",
        statement: "Plan a small event, campaign, or business idea.",
        displayOrder: 5,
      },
      {
        id: "free-afternoon-conventional",
        dimension: "conventional",
        statement: "Arrange information, manage a budget, or create a clear system.",
        displayOrder: 6,
      },
    ],
  },
  {
    id: "team-role",
    title: "Team role",
    question:
      "In a group assignment, which roles would you prefer most, second most, and least?",
    displayOrder: 3,
    choices: [
      {
        id: "team-role-realistic",
        dimension: "realistic",
        statement: "Build, test, or operate the practical part.",
        displayOrder: 1,
      },
      {
        id: "team-role-investigative",
        dimension: "investigative",
        statement: "Analyze the problem and check the evidence.",
        displayOrder: 2,
      },
      {
        id: "team-role-artistic",
        dimension: "artistic",
        statement: "Develop the visual style and original concept.",
        displayOrder: 3,
      },
      {
        id: "team-role-social",
        dimension: "social",
        statement: "Help team members cooperate and understand one another.",
        displayOrder: 4,
      },
      {
        id: "team-role-enterprising",
        dimension: "enterprising",
        statement: "Lead the group and persuade others to support the plan.",
        displayOrder: 5,
      },
      {
        id: "team-role-conventional",
        dimension: "conventional",
        statement: "Track tasks, deadlines, numbers, and documentation.",
        displayOrder: 6,
      },
    ],
  },
  {
    id: "problem-to-solve",
    title: "Problem to solve",
    question:
      "Which problems would you find most, second most, and least satisfying to solve?",
    displayOrder: 4,
    choices: [
      {
        id: "problem-to-solve-realistic",
        dimension: "realistic",
        statement: "A machine or device is not working correctly.",
        displayOrder: 1,
      },
      {
        id: "problem-to-solve-investigative",
        dimension: "investigative",
        statement: "Available information does not explain what is happening.",
        displayOrder: 2,
      },
      {
        id: "problem-to-solve-artistic",
        dimension: "artistic",
        statement: "A message needs to become more engaging and original.",
        displayOrder: 3,
      },
      {
        id: "problem-to-solve-social",
        dimension: "social",
        statement: "A person needs guidance, support, or explanation.",
        displayOrder: 4,
      },
      {
        id: "problem-to-solve-enterprising",
        dimension: "enterprising",
        statement: "A project needs more customers, supporters, or funding.",
        displayOrder: 5,
      },
      {
        id: "problem-to-solve-conventional",
        dimension: "conventional",
        statement: "Records and processes are disorganized or inaccurate.",
        displayOrder: 6,
      },
    ],
  },
  {
    id: "future-workday",
    title: "Future workday",
    question:
      "Which kinds of workday would you prefer most, second most, and least?",
    displayOrder: 5,
    choices: [
      {
        id: "future-workday-realistic",
        dimension: "realistic",
        statement:
          "Working with equipment, physical systems, or practical activities.",
        displayOrder: 1,
      },
      {
        id: "future-workday-investigative",
        dimension: "investigative",
        statement:
          "Studying information, testing ideas, and solving complex problems.",
        displayOrder: 2,
      },
      {
        id: "future-workday-artistic",
        dimension: "artistic",
        statement: "Producing creative content or expressing original ideas.",
        displayOrder: 3,
      },
      {
        id: "future-workday-social",
        dimension: "social",
        statement: "Teaching, advising, helping, or developing people.",
        displayOrder: 4,
      },
      {
        id: "future-workday-enterprising",
        dimension: "enterprising",
        statement: "Leading, negotiating, selling, or developing opportunities.",
        displayOrder: 5,
      },
      {
        id: "future-workday-conventional",
        dimension: "conventional",
        statement:
          "Managing information, finances, records, and structured procedures.",
        displayOrder: 6,
      },
    ],
  },
] as const satisfies readonly QuickInterestScenario[];
