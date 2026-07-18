import type { DegreeProgram } from "../types/program";
import {
  isRiasecScore,
  riasecDimensionCodes,
  riasecDimensionOrder,
  type ProgramRiasecWeights,
  type RiasecDimension,
} from "../types/riasec";

const EXPECTED_WEIGHT_TOTAL = 100;
const EXPECTED_DIMENSION_ORDER = "RIASEC";

export interface RiasecDataValidationResult {
  valid: boolean;
  errors: string[];
}

function validateDimensionOrder(errors: string[]): void {
  const codes = riasecDimensionOrder
    .map((dimension) => riasecDimensionCodes[dimension])
    .join("");
  const uniqueDimensions = new Set<RiasecDimension>(riasecDimensionOrder);

  if (
    codes !== EXPECTED_DIMENSION_ORDER ||
    uniqueDimensions.size !== riasecDimensionOrder.length
  ) {
    errors.push(
      `RIASEC dimension order must be ${EXPECTED_DIMENSION_ORDER}; received ${codes}.`,
    );
  }
}

export function validateRiasecData(
  programData: readonly Pick<DegreeProgram, "id">[],
  mappings: readonly ProgramRiasecWeights[],
): RiasecDataValidationResult {
  const errors: string[] = [];
  const knownProgramIds = new Set<string>(programData.map(({ id }) => id));
  const seenProgramIds = new Set<string>();

  validateDimensionOrder(errors);

  for (const mapping of mappings) {
    const programId = mapping.programId as string;

    if (!knownProgramIds.has(programId)) {
      errors.push(`Unknown program ID in RIASEC mappings: ${programId}.`);
    }
    if (seenProgramIds.has(programId)) {
      errors.push(`Duplicate RIASEC mapping for program ID: ${programId}.`);
    }
    seenProgramIds.add(programId);

    const weightRecord = mapping.weights as Record<string, unknown>;
    const keys = Object.keys(weightRecord);
    const missingDimensions = riasecDimensionOrder.filter(
      (dimension) =>
        !Object.prototype.hasOwnProperty.call(weightRecord, dimension),
    );
    const unknownDimensions = keys.filter(
      (key) => !riasecDimensionOrder.includes(key as RiasecDimension),
    );

    if (
      keys.length !== riasecDimensionOrder.length ||
      missingDimensions.length > 0 ||
      unknownDimensions.length > 0
    ) {
      errors.push(
        `${programId} must contain exactly the six RIASEC dimensions.`,
      );
    }

    let total = 0;
    for (const dimension of riasecDimensionOrder) {
      const weight = weightRecord[dimension];
      if (!isRiasecScore(weight)) {
        errors.push(
          `${programId} ${dimension} weight must be between 0 and 100.`,
        );
        continue;
      }
      total += weight;
    }

    if (total !== EXPECTED_WEIGHT_TOTAL) {
      errors.push(
        `${programId} RIASEC weights total ${total}, expected ${EXPECTED_WEIGHT_TOTAL}.`,
      );
    }
  }

  for (const { id } of programData) {
    if (!seenProgramIds.has(id)) {
      errors.push(`Missing RIASEC mapping for program ID: ${id}.`);
    }
  }

  if (mappings.length !== programData.length) {
    errors.push(
      `Expected exactly ${programData.length} RIASEC mappings, received ${mappings.length}.`,
    );
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidRiasecData(
  programData: readonly Pick<DegreeProgram, "id">[],
  mappings: readonly ProgramRiasecWeights[],
): void {
  const result = validateRiasecData(programData, mappings);
  if (!result.valid) {
    throw new Error(`RIASEC data validation failed:\n${result.errors.join("\n")}`);
  }
}
