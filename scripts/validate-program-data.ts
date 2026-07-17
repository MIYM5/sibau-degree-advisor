import { programs } from "../src/data/programs";
import { assertValidProgramData } from "../src/lib/validate-program-data";

const EXPECTED_PROGRAM_COUNT = 14;

if (programs.length !== EXPECTED_PROGRAM_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_PROGRAM_COUNT} programs, received ${programs.length}.`,
  );
}

assertValidProgramData(programs);

console.log(
  `Validated ${programs.length} programs: unique IDs, eligibility metadata, thresholds, working Pre-Medical access, and all weight totals passed.`,
);
