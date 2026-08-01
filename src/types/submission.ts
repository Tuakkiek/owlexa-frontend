import type {
  AssessmentBlockResponse,
  AssessmentType,
  PlaybackMode,
} from "./assessmentBuilder";
import type {
  AssignmentRecipientStatus,
  AssignmentTargetType,
} from "./assignment";
import type { FileMetadata } from "./file";
import type { QuestionDifficulty, QuestionType } from "./questionBank";
import type { EditorDocument } from "../components/editor";

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
  content: EditorDocument;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  explanation: EditorDocument | null;
  sampleAnswer: EditorDocument | null;
  gradingCriteriaName: string | null;
  gradingCriteriaContent: EditorDocument | null;
  displayOrder: number;
  options: SubmissionAttemptItemOptionResponse[];
}

export interface StudentAttemptItemResponse {
  assignmentItemId: number;
  questionType: QuestionType;
  title: string | null;
  content: EditorDocument;
  difficulty: QuestionDifficulty | null;
  points: number | null;
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
  aiScore?: number | null;
  displayedScore?: number | null;
  maxScore: number | null;
}

export interface StudentAIGradingItemResultResponse {
  id: number;
  assignmentItemId: number;
  aiScore: number | null;
  maxScore: number | null;
  feedback: string | null;
  rubricAnalysis: string | null;
  confidence: number | null;
}

export interface StudentAIGradingCriterionResultResponse {
  name: string;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
}

export interface StudentAIGradingImprovementResponse {
  category: string | null;
  issue: string | null;
  suggestion: string | null;
  example: string | null;
}

export interface StudentAIGradingResultResponse {
  resultId: number;
  jobId: number;
  summary: string | null;
  overallFeedback: string | null;
  focusArea: string | null;
  aiScore: number | null;
  maxScore: number | null;
  confidence: number | null;
  createdAt: string;
  criteria: StudentAIGradingCriterionResultResponse[];
  improvements: StudentAIGradingImprovementResponse[];
  itemResults: StudentAIGradingItemResultResponse[];
}

export interface StudentAttemptDetailResponse {
  id: number;
  assignmentId: number;
  assignmentRecipientId: number;
  assignmentTitleSnapshot: string;
  assignmentTypeSnapshot: AssessmentType;

  assignmentContent: EditorDocument;
  status: SubmissionAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  autoScore: number | null;
  maxScore: number | null;
  audioFile: FileMetadata | null;
  playbackMode: PlaybackMode;
  items: StudentAttemptItemResponse[];
  answers: SubmissionAnswerResponse[];
  blocks?: AssessmentBlockResponse[];
  showScore?: boolean;
  allowReview?: boolean;
  hasPassword?: boolean;
  aiResult?: StudentAIGradingResultResponse | null;
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
  latestFinalScore?: number | null;
  isGraded?: boolean | null;
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

  assignmentContent: EditorDocument;
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
