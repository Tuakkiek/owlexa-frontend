import type { AssessmentType, PlaybackMode } from "./assessmentBuilder";
import type { FileMetadata } from "./file";
import type { QuestionDifficulty, QuestionType } from "./questionBank";
import type { EditorDocument } from "../components/editor";


export type { PageResponse } from "./pagination";

export type AssignmentStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";

export type AssignmentTargetType = "CLASS" | "STUDENT";

export type AssignmentRecipientStatus = "ASSIGNED";

export interface AssignmentTargetRequest {
  targetType: AssignmentTargetType;
  classId?: number | null;
  studentUserId?: number | null;
}

export interface AssignmentRequest {
  assessmentId: number;
  title: string;
  description?: string | null;
  openAt?: string | null;
  dueAt?: string | null;
  attemptLimit?: number | null;
  showScore?: boolean | null;
  allowReview?: boolean | null;
  accessPassword?: string | null;
  targets?: AssignmentTargetRequest[] | null;
}

export interface AssignmentTargetResponse {
  id: number;
  targetType: AssignmentTargetType;
  classId: number | null;
  className: string | null;
  studentUserId: number | null;
  studentFullName: string | null;
}

export interface AssignmentRecipientResponse {
  id: number;
  studentUserId: number;
  studentFullName: string | null;
  classId: number | null;
  className: string | null;
  sourceType: AssignmentTargetType;
  status: AssignmentRecipientStatus;
  assignedAt: string;
}

export interface AssignmentItemOptionResponse {
  id: number;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface AssignmentItemResponse {
  id: number;
  assessmentItemId: number | null;
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
  options: AssignmentItemOptionResponse[];
}


export interface AssignmentListResponse {
  id: number;
  assessmentId: number;
  type: AssessmentType;

  status: AssignmentStatus;
  title: string;
  description: string | null;
  content: EditorDocument;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  assessmentSnapshotAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentDetailResponse {
  id: number;
  assessmentId: number;
  type: AssessmentType;

  status: AssignmentStatus;
  title: string;
  description: string | null;
  content: EditorDocument;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  showScore: boolean;
  allowReview: boolean;
  accessPassword: string | null;
  hasPassword: boolean;
  assessmentSnapshotAt: string | null;
  audioFile: FileMetadata | null;
  playbackMode: PlaybackMode;
  targets: AssignmentTargetResponse[];
  recipients: AssignmentRecipientResponse[];
  items: AssignmentItemResponse[];
  blocks?: import('./assessmentBuilder').AssessmentBlockResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentAssignmentListResponse {
  id: number;
  recipientId: number;
  type: AssessmentType;

  status: AssignmentStatus;
  recipientStatus: AssignmentRecipientStatus;
  title: string;
  description: string | null;
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  showScore: boolean;
  allowReview: boolean;
  hasPassword: boolean;
  assignedAt: string;
}

export interface AssignmentSearchParams {
  search?: string;
  type?: AssessmentType | "";
  status?: AssignmentStatus | "";
  classId?: number | "";
  page?: number;
  size?: number;
}
