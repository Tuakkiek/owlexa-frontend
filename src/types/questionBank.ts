export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface GradingCriteriaSummary {
  id: number;
  name: string;
}

export interface QuestionOptionRequest {
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuestionRequest {
  type: QuestionType;
  title?: string | null;
  content: string;
  difficulty?: QuestionDifficulty | null;
  points?: number | null;
  gradingCriteriaId?: number | null;
  explanation?: string | null;
  sampleAnswer?: string | null;
  options?: QuestionOptionRequest[] | null;
}

export interface QuestionOptionResponse {
  id: number;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuestionResponse {
  id: number;
  type: QuestionType;
  title: string | null;
  content: string;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  gradingCriteria: GradingCriteriaSummary | null;
  explanation: string | null;
  sampleAnswer: string | null;
  options: QuestionOptionResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSearchParams {
  search?: string;
  type?: QuestionType | "";
  difficulty?: QuestionDifficulty | "";
  gradingCriteriaId?: number | "";
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
