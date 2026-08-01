import type { AssessmentType } from "./assessmentBuilder";

import type {
  StudentAttemptItemResponse,
  SubmissionAnswerResponse,
  SubmissionAttemptStatus,
} from "./submission";

export type { PageResponse } from "./pagination";

export type TeacherReviewStatus =
  | "IN_PROGRESS"
  | "FINALIZED"
  | "RELEASED";

export type TeacherReviewQueueStatus =
  | TeacherReviewStatus
  | "UNREVIEWED";

export interface TeacherReviewItemRequest {
  assignmentItemId: number;
  finalScore?: number | null;
  itemComment?: string | null;
}

export interface TeacherReviewUpdateRequest {
  version: number;
  selectedAiGradingResultId?: number | null;
  overallComment?: string | null;
  items: TeacherReviewItemRequest[];
}

export interface TeacherReviewItemResponse {
  id: number;
  assignmentItemId: number;
  submissionAnswerId: number | null;
  questionTitleSnapshot: string | null;
  displayOrderSnapshot: number;
  finalScore: number | null;
  maxScore: number;
  itemComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherReviewDetailResponse {
  id: number;
  submissionAttemptId: number;
  selectedAiGradingResultId: number | null;
  status: TeacherReviewStatus;
  overallComment: string | null;
  autoScore: number | null;
  finalScore: number | null;
  maxScore: number;
  version: number;
  items: TeacherReviewItemResponse[];
  createdByUserId: number;
  createdByFullName: string | null;
  updatedByUserId: number;
  updatedByFullName: string | null;
  finalizedByUserId: number | null;
  finalizedByFullName: string | null;
  finalizedAt: string | null;
  releasedByUserId: number | null;
  releasedByFullName: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherReviewSummaryResponse {
  submissionAttemptId: number;
  assignmentId: number;
  assignmentRecipientId: number;
  studentUserId: number;
  studentFullName: string | null;
  classId: number | null;
  className: string | null;
  attemptNumber: number;
  submissionStatus: SubmissionAttemptStatus;
  submittedAt: string | null;
  reviewId: number | null;
  reviewStatus: TeacherReviewStatus | null;
  hasEssay: boolean;
  hasAiResult: boolean;
  selectedAiGradingResultId: number | null;
  autoScore: number | null;
  finalScore: number | null;
  maxScore: number | null;
}

export interface StudentReviewItemResultResponse {
  assignmentItemId: number;
  questionTitle: string | null;
  displayOrder: number;
  finalScore: number;
  maxScore: number;
  teacherComment: string | null;
}

export interface StudentReviewResultResponse {
  submissionAttemptId: number;
  assignmentTitleSnapshot: string;
  assignmentTypeSnapshot: AssessmentType;

  attemptNumber: number;
  finalScore: number;
  maxScore: number;
  overallComment: string | null;
  releasedAt: string;
  items: StudentAttemptItemResponse[];

  answers: SubmissionAnswerResponse[];
  essayItems: StudentReviewItemResultResponse[];
}

export interface TeacherReviewQueueParams {
  reviewStatus?: TeacherReviewQueueStatus | "";
  page?: number;
  size?: number;
}
