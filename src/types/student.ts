import type {
  AptitudeDimension,
  InterestDimension,
  IntermediateGroup,
  Subject,
} from "./program";

export interface SubjectMark {
  subject: Subject;
  obtainedMarks: number;
  totalMarks: number;
  calculatedPercentage: number;
}

export type InterestScores = Partial<Record<InterestDimension, number>>;
export type AptitudeScores = Partial<Record<AptitudeDimension, number>>;

export interface StudentProfile {
  name: string;
  intermediateGroup: IntermediateGroup;
  subjectMarks: SubjectMark[];
  interestScores: InterestScores;
  aptitudeScores: AptitudeScores;
}
