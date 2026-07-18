import { programRiasecWeights } from "../src/data/program-riasec-weights";
import { programs } from "../src/data/programs";
import { validateRiasecData } from "../src/lib/validate-riasec-data";
import type { ProgramId } from "../src/types/program";
import {
  createRiasecProfile,
  riasecDimensionCodes,
  riasecDimensionOrder,
  type ProgramRiasecWeights,
  type RiasecScores,
} from "../src/types/riasec";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function replaceFirstMapping(
  patch: Partial<ProgramRiasecWeights>,
): ProgramRiasecWeights[] {
  return [
    { ...programRiasecWeights[0], ...patch } as ProgramRiasecWeights,
    ...programRiasecWeights.slice(1),
  ];
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "Exactly six RIASEC dimensions exist",
    run: () =>
      assert(
        riasecDimensionOrder.length === 6 &&
          new Set(riasecDimensionOrder).size === 6,
        "Expected exactly six unique dimensions.",
      ),
  },
  {
    name: "Stable dimension order is R, I, A, S, E, C",
    run: () => {
      const codes = riasecDimensionOrder
        .map((dimension) => riasecDimensionCodes[dimension])
        .join("");
      assert(codes === "RIASEC", `Expected RIASEC, received ${codes}.`);
    },
  },
  {
    name: "All 14 programs have RIASEC mappings",
    run: () => {
      const mappedIds = new Set(programRiasecWeights.map(({ programId }) => programId));
      assert(programRiasecWeights.length === 14, "Expected 14 mappings.");
      assert(
        programs.every(({ id }) => mappedIds.has(id)),
        "Every program should have a mapping.",
      );
    },
  },
  {
    name: "Unknown program IDs are rejected",
    run: () => {
      const result = validateRiasecData(
        programs,
        replaceFirstMapping({
          programId: "SIBAU-UNKNOWN" as ProgramId,
        }),
      );
      assert(
        result.errors.some((error) => error.includes("Unknown program ID")),
        "Expected an unknown-program error.",
      );
    },
  },
  {
    name: "Duplicate program mappings are rejected",
    run: () => {
      const result = validateRiasecData(programs, [
        ...programRiasecWeights,
        programRiasecWeights[0],
      ]);
      assert(
        result.errors.some((error) => error.includes("Duplicate RIASEC mapping")),
        "Expected a duplicate-program error.",
      );
    },
  },
  {
    name: "Every mapping must contain all six dimensions",
    run: () => {
      const incompleteWeights = Object.fromEntries(
        Object.entries(programRiasecWeights[0].weights).filter(
          ([dimension]) => dimension !== "conventional",
        ),
      ) as RiasecScores;
      const result = validateRiasecData(
        programs,
        replaceFirstMapping({ weights: incompleteWeights }),
      );
      assert(
        result.errors.some((error) => error.includes("exactly the six")),
        "Expected an incomplete-dimensions error.",
      );
    },
  },
  {
    name: "Negative and above-100 weights are rejected",
    run: () => {
      const negative = validateRiasecData(
        programs,
        replaceFirstMapping({
          weights: { ...programRiasecWeights[0].weights, realistic: -1 },
        }),
      );
      const aboveMaximum = validateRiasecData(
        programs,
        replaceFirstMapping({
          weights: { ...programRiasecWeights[0].weights, realistic: 101 },
        }),
      );
      assert(
        negative.errors.some((error) => error.includes("between 0 and 100")) &&
          aboveMaximum.errors.some((error) =>
            error.includes("between 0 and 100"),
          ),
        "Expected range errors for both invalid weights.",
      );
    },
  },
  {
    name: "Every mapping totals exactly 100",
    run: () => {
      const result = validateRiasecData(programs, programRiasecWeights);
      assert(result.valid, result.errors.join("\n"));
      for (const mapping of programRiasecWeights) {
        const total = Object.values(mapping.weights).reduce(
          (sum, weight) => sum + weight,
          0,
        );
        assert(total === 100, `${mapping.programId} totals ${total}.`);
      }
    },
  },
  {
    name: "Top-three ordering is deterministic when scores tie",
    run: () => {
      const profile = createRiasecProfile(
        {
          realistic: 90,
          investigative: 80,
          artistic: 80,
          social: 80,
          enterprising: 80,
          conventional: 80,
        },
        "Preliminary guidance",
      );
      assert(
        profile.topThreeDimensions.join(",") ===
          "realistic,investigative,artistic",
        "Ties should follow stable R-I-A-S-E-C order.",
      );
    },
  },
  {
    name: "Three-letter Holland-style code generation works",
    run: () => {
      const profile = createRiasecProfile(
        {
          realistic: 10,
          investigative: 20,
          artistic: 30,
          social: 80,
          enterprising: 90,
          conventional: 70,
        },
        "Stronger interest evidence",
      );
      assert(profile.hollandCode === "ESC", "Expected ESC profile code.");
      assert(
        profile.topThreeLabels.join(",") ===
          "Enterprising,Social,Conventional",
        "Expected user-friendly labels in ranked order.",
      );
    },
  },
];

for (const test of tests) {
  test.run();
  console.log(`PASS: ${test.name}`);
}

console.log(`RIASEC data tests passed: ${tests.length}/${tests.length}.`);
