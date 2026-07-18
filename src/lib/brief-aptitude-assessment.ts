import { briefAptitudeTasks } from "../data/brief-aptitude-tasks";
import type {
  BriefAptitudeAssessmentResult,
  BriefAptitudeChoiceId,
  BriefAptitudeResponse,
  BriefAptitudeTask,
  BriefAptitudeTaskId,
  BriefAptitudeValidationError,
  BriefAptitudeValidationResult,
} from "../types/brief-aptitude";

/**
 * This key is deliberately separate from the user-facing task bank. It is used
 * only by the local scorer and is never passed to the aptitude UI component.
 * Client-side MVP code is not a security boundary.
 */
const correctChoiceByTask: Readonly<
  Record<BriefAptitudeTaskId, BriefAptitudeChoiceId>
> = {
  "brief-numerical": "brief-numerical-C",
  "brief-logical": "brief-logical-D",
  "brief-verbal": "brief-verbal-B",
  "brief-spatial-technical": "brief-spatial-technical-B",
  "brief-data-interpretation": "brief-data-interpretation-B",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateBriefAptitudeConfiguration(
  tasks: readonly BriefAptitudeTask[] = briefAptitudeTasks,
): BriefAptitudeValidationError[] {
  const errors: BriefAptitudeValidationError[] = [];
  const taskIds = new Set(tasks.map(({ id }) => id));

  for (const task of tasks) {
    const correctChoiceId = correctChoiceByTask[task.id];
    if (
      !correctChoiceId ||
      !task.choices.some((choice) => choice.id === correctChoiceId)
    ) {
      errors.push({
        code: "invalid_task_configuration",
        taskId: task.id,
        message: `${task.title} must have exactly one valid answer-key entry.`,
      });
    }
  }

  for (const taskId of Object.keys(correctChoiceByTask)) {
    if (!taskIds.has(taskId as BriefAptitudeTaskId)) {
      errors.push({
        code: "invalid_task_configuration",
        taskId,
        message: `The answer key contains an unknown task: ${taskId}.`,
      });
    }
  }

  return errors;
}

export function validateBriefAptitudeResponses(
  value: unknown,
  tasks: readonly BriefAptitudeTask[] = briefAptitudeTasks,
): BriefAptitudeValidationResult {
  const errors = validateBriefAptitudeConfiguration(tasks);
  const validResponses: BriefAptitudeResponse[] = [];
  const seenTaskIds = new Set<string>();
  const validTaskIds = new Set<string>();
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const allChoiceIds: ReadonlySet<string> = new Set(
    tasks.flatMap((task) => task.choices.map((choice) => choice.id)),
  );

  if (!Array.isArray(value)) {
    errors.push({
      code: "malformed_responses",
      message: "Brief aptitude responses must be provided as a list.",
    });
  } else {
    for (const candidate of value) {
      if (
        !isRecord(candidate) ||
        typeof candidate.taskId !== "string" ||
        typeof candidate.selectedChoiceId !== "string"
      ) {
        errors.push({
          code: "malformed_response",
          message: "A brief aptitude response is malformed.",
        });
        continue;
      }

      const taskId = candidate.taskId;
      const task = taskById.get(taskId as BriefAptitudeTaskId);
      if (!task) {
        errors.push({
          code: "unknown_task",
          taskId,
          message: `Unknown brief aptitude task: ${taskId}.`,
        });
        continue;
      }
      if (seenTaskIds.has(taskId)) {
        errors.push({
          code: "duplicate_task_response",
          taskId,
          message: `${task.title} has more than one response.`,
        });
        continue;
      }
      seenTaskIds.add(taskId);

      const selectedChoiceId = candidate.selectedChoiceId;
      if (!allChoiceIds.has(selectedChoiceId)) {
        errors.push({
          code: "unknown_choice",
          taskId,
          message: `${task.title} contains an unknown choice: ${selectedChoiceId}.`,
        });
        continue;
      }
      if (!task.choices.some((choice) => choice.id === selectedChoiceId)) {
        errors.push({
          code: "choice_not_in_task",
          taskId,
          message: `${selectedChoiceId} does not belong to ${task.title}.`,
        });
        continue;
      }

      validResponses.push({
        taskId: task.id,
        selectedChoiceId: selectedChoiceId as BriefAptitudeChoiceId,
      });
      validTaskIds.add(task.id);
    }
  }

  const missingTaskIds = tasks
    .filter((task) => !validTaskIds.has(task.id))
    .map(({ id }) => id);
  for (const taskId of missingTaskIds) {
    errors.push({
      code: "missing_task",
      taskId,
      message: `${taskById.get(taskId)?.title ?? taskId} must be answered.`,
    });
  }

  validResponses.sort(
    (left, right) =>
      (taskById.get(left.taskId)?.displayOrder ?? 0) -
      (taskById.get(right.taskId)?.displayOrder ?? 0),
  );

  return {
    responses: validResponses,
    missingTaskIds,
    errors,
    isComplete: missingTaskIds.length === 0,
    isValid: missingTaskIds.length === 0 && errors.length === 0,
  };
}

export function calculateBriefAptitudeAssessment(
  value: unknown,
  tasks: readonly BriefAptitudeTask[] = briefAptitudeTasks,
): BriefAptitudeAssessmentResult {
  const validation = validateBriefAptitudeResponses(value, tasks);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const taskResults = validation.responses.flatMap((response) => {
    const task = taskById.get(response.taskId);
    if (!task) return [];
    return [
      {
        taskId: task.id,
        taskTitle: task.title,
        dimension: task.dimension,
        selectedChoiceId: response.selectedChoiceId,
        isCorrect:
          response.selectedChoiceId === correctChoiceByTask[response.taskId],
      },
    ];
  });
  const totalCorrect = taskResults.filter(({ isCorrect }) => isCorrect).length;
  const totalTasks = tasks.length;
  const answeredTasks = validation.responses.length;

  return {
    responses: validation.responses,
    taskResults,
    totalCorrect,
    totalTasks,
    overallPercentage:
      totalTasks > 0 ? (totalCorrect / totalTasks) * 100 : 0,
    evidenceCoverage: {
      answeredTasks,
      totalTasks,
      percentageCoverage:
        totalTasks > 0 ? (answeredTasks / totalTasks) * 100 : 0,
    },
    confidenceLabel: "Limited",
    missingTaskIds: validation.missingTaskIds,
    errors: validation.errors,
    isComplete: validation.isComplete,
    isValid: validation.isValid,
  };
}

export function serializeBriefAptitudeResponses(
  responses: readonly BriefAptitudeResponse[],
): string {
  return JSON.stringify(responses);
}

export function parseBriefAptitudeResponses(
  serialized: string | null,
): BriefAptitudeResponse[] | null {
  if (serialized === null) return null;
  try {
    const result = calculateBriefAptitudeAssessment(JSON.parse(serialized));
    return result.isValid ? result.responses : null;
  } catch {
    return null;
  }
}
