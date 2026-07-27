import type { AssessmentType } from "./assessmentBuilder";
import type {
  AssignmentRecipientStatus,
  AssignmentTargetType,
} from "./assignment";
import type { QuestionDifficulty, QuestionType } from "./questionBank";

export type { PageResponse } from "./pagination";

export type SubmissionAttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED";

export interface SubmissionAnswerRequest {
  assignmentItemId: number;
  answerText?: string | null;
  selectedOptionIds?: number[] | null;
}

export interface SaveSubmissionAnswersRequest {
  answers: SubmissionAnswerRequest[];
}

export interface SubmissionAttemptItemOptionResponse {
  assignmentItemOptionId: number;
  content: string;
  displayOrder: number;
}

export interface SubmissionAttemptItemResponse {
  assignmentItemId: number;
  questionType: QuestionType;
  title: string | null;
  content: string;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  explanation: string | null;
  sampleAnswer: string | null;
  gradingCriteriaName: string | null;
  gradingCriteriaContent: string | null;
  displayOrder: number;
  options: SubmissionAttemptItemOptionResponse[];
}

export interface SubmissionAnswerResponse {
  assignmentItemId: number;
  answerText: string | null;
  selectedOptionIds: number[];
  autoScore: number | null;
  maxScore: number | null;
  gradedAt: string | null;
}

export interface StudentAttemptSummaryResponse {
  id: number;
  attemptNumber: number;
  status: SubmissionAttemptStatus;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  autoScore: number | null;
  maxScore: number | null;
}

export interface StudentAttemptDetailResponse {
  id: number;
  assignmentId: number;
  assignmentRecipientId: number;
  assignmentTitleSnapshot: string;
  assignmentTypeSnapshot: AssessmentType;
  status: SubmissionAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  autoScore: number | null;
  maxScore: number | null;
  items: SubmissionAttemptItemResponse[];
  answers: SubmissionAnswerResponse[];
}

export interface TeacherSubmissionSummaryResponse {
  recipientId: number;
  studentUserId: number;
  studentFullName: string | null;
  classId: number | null;
  className: string | null;
  sourceType: AssignmentTargetType;
  recipientStatus: AssignmentRecipientStatus;
  latestAttemptId: number | null;
  latestAttemptNumber: number | null;
  latestStatus: SubmissionAttemptStatus | null;
  latestStartedAt: string | null;
  latestSubmittedAt: string | null;
  latestAutoScore: number | null;
  maxScore: number | null;
  attemptsCount: number;
}

export interface TeacherAttemptDetailResponse {
  id: number;
  assignmentId: number;
  assignmentRecipientId: number;
  studentUserId: number;
  studentFullName: string | null;
  classId: number | null;
  className: string | null;
  sourceType: AssignmentTargetType;
  recipientStatus: AssignmentRecipientStatus;
  assignmentTitleSnapshot: string;
  assignmentTypeSnapshot: AssessmentType;
  status: SubmissionAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  autoScore: number | null;
  maxScore: number | null;
  items: SubmissionAttemptItemResponse[];
  answers: SubmissionAnswerResponse[];
}

export interface TeacherSubmissionSearchParams {
  page?: number;
  size?: number;
}
