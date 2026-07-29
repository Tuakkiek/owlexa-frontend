export type AIGradingJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export const isTerminalAIGradingJobStatus = (
  status: AIGradingJobStatus,
) => status === "COMPLETED" || status === "FAILED";

export interface AIGradingJobSummaryResponse {
  id: number;
  submissionAttemptId: number;
  status: AIGradingJobStatus;
  requestedByUserId: number;
  requestedByFullName: string | null;
  resultId: number | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIGradingItemResultResponse {
  id: number;
  submissionAnswerId: number;
  assignmentItemId: number;
  aiScore: number | null;
  maxScore: number | null;
  feedback: string | null;
  rubricAnalysis: string | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIGradingResultResponse {
  id: number;
  jobId: number;
  submissionAttemptId: number;
  summary: string | null;
  overallFeedback: string | null;
  aiScore: number | null;
  maxScore: number | null;
  confidence: number | null;
  itemResults: AIGradingItemResultResponse[];
  createdAt: string;
  updatedAt: string;
}
