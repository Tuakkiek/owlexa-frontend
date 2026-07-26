import type { AssessmentType } from "./assessmentBuilder";
import type { QuestionDifficulty, QuestionType } from "./questionBank";

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
  content: string;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  explanation: string | null;
  sampleAnswer: string | null;
  gradingCriteriaName: string | null;
  gradingCriteriaContent: string | null;
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
  openAt: string | null;
  dueAt: string | null;
  attemptLimit: number | null;
  assessmentSnapshotAt: string | null;
  targets: AssignmentTargetResponse[];
  recipients: AssignmentRecipientResponse[];
  items: AssignmentItemResponse[];
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
  assignedAt: string;
}

export interface StudentAssignmentDetailResponse {
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
  assignedAt: string;
  items: AssignmentItemResponse[];
}

export interface AssignmentSearchParams {
  search?: string;
  type?: AssessmentType | "";
  status?: AssignmentStatus | "";
  classId?: number | "";
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
