import type { ProgramRiasecWeights } from "../types/riasec";

/**
 * Version 2 RIASEC mappings are project-model assumptions. They are not
 * official SIBAU weightages, and they were not supplied or endorsed by O*NET.
 * Every mapping requires review by faculty and career-guidance experts before
 * it is connected to active recommendations.
 */
export const programRiasecWeights = [
  {
    programId: "SIBAU-BEEE",
    weights: {
      realistic: 35,
      investigative: 35,
      artistic: 5,
      social: 5,
      enterprising: 10,
      conventional: 10,
    },
  },
  {
    programId: "SIBAU-BECSE",
    weights: {
      realistic: 30,
      investigative: 40,
      artistic: 5,
      social: 5,
      enterprising: 10,
      conventional: 10,
    },
  },
  {
    programId: "SIBAU-BSCS",
    weights: {
      realistic: 20,
      investigative: 45,
      artistic: 5,
      social: 5,
      enterprising: 10,
      conventional: 15,
    },
  },
  {
    programId: "SIBAU-BSSE",
    weights: {
      realistic: 20,
      investigative: 40,
      artistic: 10,
      social: 10,
      enterprising: 10,
      conventional: 10,
    },
  },
  {
    programId: "SIBAU-BSAI",
    weights: {
      realistic: 15,
      investigative: 50,
      artistic: 5,
      social: 5,
      enterprising: 10,
      conventional: 15,
    },
  },
  {
    programId: "SIBAU-BSMATH",
    weights: {
      realistic: 5,
      investigative: 60,
      artistic: 5,
      social: 10,
      enterprising: 5,
      conventional: 15,
    },
  },
  {
    programId: "SIBAU-BBA",
    weights: {
      realistic: 5,
      investigative: 10,
      artistic: 10,
      social: 15,
      enterprising: 40,
      conventional: 20,
    },
  },
  {
    programId: "SIBAU-BBA-AGRI",
    weights: {
      realistic: 20,
      investigative: 10,
      artistic: 5,
      social: 15,
      enterprising: 35,
      conventional: 15,
    },
  },
  {
    programId: "SIBAU-BSAF",
    weights: {
      realistic: 5,
      investigative: 15,
      artistic: 5,
      social: 5,
      enterprising: 30,
      conventional: 40,
    },
  },
  {
    programId: "SIBAU-BSECO",
    weights: {
      realistic: 5,
      investigative: 35,
      artistic: 5,
      social: 10,
      enterprising: 25,
      conventional: 20,
    },
  },
  {
    programId: "SIBAU-BSMC",
    weights: {
      realistic: 5,
      investigative: 10,
      artistic: 45,
      social: 20,
      enterprising: 15,
      conventional: 5,
    },
  },
  {
    programId: "SIBAU-BEDH",
    weights: {
      realistic: 5,
      investigative: 15,
      artistic: 10,
      social: 45,
      enterprising: 15,
      conventional: 10,
    },
  },
  {
    programId: "SIBAU-BSPESS",
    weights: {
      realistic: 40,
      investigative: 10,
      artistic: 5,
      social: 30,
      enterprising: 10,
      conventional: 5,
    },
  },
  {
    programId: "SIBAU-ADPESS",
    weights: {
      realistic: 45,
      investigative: 5,
      artistic: 5,
      social: 30,
      enterprising: 10,
      conventional: 5,
    },
  },
] as const satisfies readonly ProgramRiasecWeights[];
