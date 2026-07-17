import type { DegreeProgram, ProgramId } from "../types/program";

const EXPECTED_WEIGHT_TOTAL = 100;
const WEIGHT_TOLERANCE = 0.000001;
const RESTRICTED_PRE_MEDICAL_PROGRAM_IDS: readonly ProgramId[] = [
  "SIBAU-BEEE",
  "SIBAU-BECSE",
];

export interface ProgramDataValidationResult {
  valid: boolean;
  errors: string[];
}

function totalWeights(weights: Record<string, number | undefined>): number {
  return Object.values(weights).reduce<number>(
    (total, weight) => total + (weight ?? 0),
    0,
  );
}

function isPercentage(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100;
}

function acceptsPreMedical(program: DegreeProgram): boolean {
  return program.requiredGroups.some(
    (group) =>
      group === "Pre-Medical" || group === "Any Intermediate/F.Sc group",
  );
}

export function validateProgramData(
  programData: readonly DegreeProgram[],
): ProgramDataValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<ProgramId>();

  for (const program of programData) {
    if (seenIds.has(program.id)) {
      errors.push(`Duplicate program ID: ${program.id}`);
    }
    seenIds.add(program.id);

    const weightGroups = [
      ["academic", totalWeights(program.academicWeights)],
      ["aptitude", totalWeights(program.aptitudeWeights)],
      ["interest", totalWeights(program.interestWeights)],
    ] as const;

    for (const [label, total] of weightGroups) {
      if (Math.abs(total - EXPECTED_WEIGHT_TOTAL) > WEIGHT_TOLERANCE) {
        errors.push(
          `${program.id} ${label} weights total ${total}, expected ${EXPECTED_WEIGHT_TOTAL}.`,
        );
      }
    }

    if (!isPercentage(program.minimumOverallPercentage)) {
      errors.push(
        `${program.id} overall minimum percentage must be between 0 and 100.`,
      );
    }

    if (!isPercentage(program.minimumSubjectPercentage)) {
      errors.push(
        `${program.id} subject minimum percentage must be between 0 and 100.`,
      );
    }

    if (!program.officialSourceUrl.trim()) {
      errors.push(`${program.id} must include an official source URL.`);
    }

    if (!program.lastVerified.trim()) {
      errors.push(`${program.id} must include a last-verified date.`);
    }

    const isRestrictedForPreMedical =
      RESTRICTED_PRE_MEDICAL_PROGRAM_IDS.includes(program.id);

    if (isRestrictedForPreMedical && acceptsPreMedical(program)) {
      errors.push(
        `${program.id} must not accept Pre-Medical under the working MVP rule.`,
      );
    }

    if (!isRestrictedForPreMedical && !acceptsPreMedical(program)) {
      errors.push(
        `${program.id} must accept Pre-Medical under the working MVP rule.`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidProgramData(
  programData: readonly DegreeProgram[],
): void {
  const result = validateProgramData(programData);

  if (!result.valid) {
    throw new Error(`Program data validation failed:\n${result.errors.join("\n")}`);
  }
}
