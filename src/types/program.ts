export type ProgramId =
  | "SIBAU-BBA"
  | "SIBAU-BBA-AGRI"
  | "SIBAU-BSCS"
  | "SIBAU-BSSE"
  | "SIBAU-BSAI"
  | "SIBAU-BSAF"
  | "SIBAU-BSECO"
  | "SIBAU-BSMATH"
  | "SIBAU-BSMC"
  | "SIBAU-BSPESS"
  | "SIBAU-ADPESS"
  | "SIBAU-BEEE"
  | "SIBAU-BECSE"
  | "SIBAU-BEDH";

export type ProgramCategory =
  | "Business & Management"
  | "Business & Agriculture"
  | "Computing"
  | "Computing & AI"
  | "Business & Finance"
  | "Economics & Social Science"
  | "Mathematics & Sciences"
  | "Media & Communication"
  | "Sports & Health"
  | "Engineering"
  | "Engineering & Computing"
  | "Education";

export type ProgramDuration = "2 Years" | "4 Years";

export type IntermediateGroup =
  | "Pre-Medical"
  | "Pre-Engineering"
  | "ICS"
  | "Commerce"
  | "Arts/Humanities"
  | "General Science"
  | "Other";

export type RequiredGroup =
  | IntermediateGroup
  | "Any Intermediate/F.Sc group";

export type Subject =
  | "Mathematics"
  | "Physics"
  | "Computer Science"
  | "English"
  | "Biology"
  | "Chemistry"
  | "Accounting"
  | "Economics"
  | "General/Other";

/**
 * An eligibility prerequisite. Separate rules allow a program to require every
 * listed subject or at least one subject from a list of alternatives.
 */
export type RequiredSubjectRule =
  | { requirement: "all"; subjects: Subject[] }
  | { requirement: "oneOf"; subjects: Subject[] };

export type AptitudeDimension =
  | "Logical Aptitude"
  | "Numerical Aptitude"
  | "Verbal/Communication Aptitude"
  | "Creative Aptitude"
  | "Spatial/Technical Aptitude"
  | "Leadership/Social Aptitude";

export type InterestDimension =
  | "Coding Interest"
  | "Technology Interest"
  | "Problem Solving Interest"
  | "Business Interest"
  | "Agriculture Interest"
  | "Finance Interest"
  | "Media/Creative Interest"
  | "Teaching Interest"
  | "Sports/Fitness Interest"
  | "Engineering/Hardware Interest"
  | "Mathematics/Research Interest";

/** Model-assumption weights; these are not official admission weightages. */
export type AcademicWeights = Partial<Record<Subject, number>>;
export type AptitudeWeights = Partial<Record<AptitudeDimension, number>>;
export type InterestWeights = Partial<Record<InterestDimension, number>>;

export type EligibilityRuleClassification =
  | "confirmed_official"
  | "working_mvp"
  | "verification_required";

export type WeightsStatus = "Model-defined recommendation weights";

/** A date stored as an ISO-style YYYY-MM-DD string. */
export type LastVerifiedDate = `${number}-${number}-${number}`;

export interface DegreeProgram {
  id: ProgramId;
  name: string;
  category: ProgramCategory;
  duration: ProgramDuration;

  // Eligibility evidence and hard requirements are kept separate from weights.
  requiredGroups: RequiredGroup[];
  requiredSubjects: RequiredSubjectRule[];
  minimumSubjectPercentage: number | null;
  minimumOverallPercentage: number | null;
  eligibilityNote: string;
  eligibilityClassification: EligibilityRuleClassification;
  officialSourceUrl: string;
  lastVerified: LastVerifiedDate;

  // These weights describe recommendation suitability, not admission eligibility.
  academicWeights: AcademicWeights;
  aptitudeWeights: AptitudeWeights;
  interestWeights: InterestWeights;
  weightsStatus: WeightsStatus;

  description: string;
  careerOptions: string[];
}
