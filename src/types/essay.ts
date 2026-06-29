export interface EssaySubmission {
  id: number;
  studentId: number;
  studentFullName: string;
  classId: number;
  className: string;
  rubricId: number;
  rubricTitle: string;
  content: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED" | "REVIEWED";
  submittedAt: string | null;
  createdAt: string;
}

export interface EssayGradingResult {
  id: number;
  submissionId: number;
  totalScore: number;
  maxScore: number;
  criteriaScores: CriteriaScore[];
  feedback: string;
  gradedAt: string;
}

export interface CriteriaScore {
  criteriaId: number;
  criteriaName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface EssayReviewRequest {
  submissionId: number;
  manualFeedback: string;
}
