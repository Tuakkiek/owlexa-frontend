export type { PageResponse } from "./pagination";
import type { EditorDocument } from "../components/editor";

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
  collectionId: number;
  sectionCode: string;
  displayOrder: number;
  type: QuestionType;
  content?: EditorDocument | null;
  difficulty?: QuestionDifficulty | null;
  points?: number | null;
  gradingCriteriaId?: number | null;
  explanation?: EditorDocument | null;
  sampleAnswer?: EditorDocument | null;
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
  questionCode: string;
  collection: QuestionCollectionSummary;
  sectionCode: string;
  displayOrder: number;
  type: QuestionType;
  content: EditorDocument;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  gradingCriteria: GradingCriteriaSummary | null;
  explanation: EditorDocument | null;
  sampleAnswer: EditorDocument | null;
  options: QuestionOptionResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSearchParams {
  search?: string;
  collectionId?: number | "";
  sectionCode?: string;
  type?: QuestionType | "";
  difficulty?: QuestionDifficulty | "";
  gradingCriteriaId?: number | "";
  sort?: QuestionSort;
  page?: number;
  size?: number;
}

export type QuestionSort =
  | "displayOrder,asc"
  | "createdAt,desc"
  | "updatedAt,desc";

export interface QuestionCollectionSummary {
  id: number;
  code: string;
  name: string;
}

export interface QuestionCollectionResponse extends QuestionCollectionSummary {
  description: string | null;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionCollectionCreateRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface QuestionCollectionUpdateRequest {
  name: string;
  description?: string | null;
}

export interface QuestionImportPreviewItem {
  questionNumber: number;
  sectionCode: string;
  displayOrder: number;
  type: QuestionType;
  content: string;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  optionCount: number;
}

export interface QuestionImportValidationResponse {
  version: string;
  collectionId: number;
  collectionName: string;
  collectionCode: string;
  questionCount: number;
  questions: QuestionImportPreviewItem[];
}

export interface QuestionImportResultResponse {
  importedCount: number;
  questions: QuestionResponse[];
}
