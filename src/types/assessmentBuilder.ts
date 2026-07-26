import type { QuestionDifficulty, QuestionType } from "./questionBank";

export type AssessmentType = "QUIZ" | "HOMEWORK" | "EXAM";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AssessmentItemRequest {
  questionId: number;
  points?: number | null;
  displayOrder: number;
}

export interface AssessmentRequest {
  title: string;
  description?: string | null;
  type: AssessmentType;
  items?: AssessmentItemRequest[] | null;
}

export interface AssessmentItemOptionResponse {
  id: number;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface AssessmentItemResponse {
  id: number;
  questionId: number;
  questionType: QuestionType;
  title: string | null;
  content: string;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  explanation: string | null;
  sampleAnswer: string | null;
  gradingCriteriaId: number | null;
  gradingCriteriaName: string | null;
  gradingCriteriaContent: string | null;
  displayOrder: number;
  options: AssessmentItemOptionResponse[];
}

export interface AssessmentListResponse {
  id: number;
  type: AssessmentType;
  status: AssessmentStatus;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDetailResponse {
  id: number;
  type: AssessmentType;
  status: AssessmentStatus;
  title: string;
  description: string | null;
  items: AssessmentItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSearchParams {
  search?: string;
  type?: AssessmentType | "";
  status?: AssessmentStatus | "";
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
