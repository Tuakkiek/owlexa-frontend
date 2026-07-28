import type { QuestionDifficulty, QuestionType } from "./questionBank";
import type { FileMetadata } from "./file";
import type { EditorDocument } from "../components/editor";

export type { PageResponse } from "./pagination";

export type AssessmentType = "QUIZ" | "HOMEWORK" | "EXAM";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PlaybackMode = "EXAM" | "PRACTICE";

export interface AssessmentItemRequest {
  questionId: number;
  points?: number | null;
  displayOrder: number;
}

export interface AssessmentRequest {
  title: string;
  description?: string | null;
  content: EditorDocument;
  type: AssessmentType;
  audioFileId?: number | null;
  playbackMode?: PlaybackMode | null;
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
  content: EditorDocument;
  difficulty: QuestionDifficulty | null;
  points: number | null;
  explanation: EditorDocument | null;
  sampleAnswer: EditorDocument | null;
  gradingCriteriaId: number | null;
  gradingCriteriaName: string | null;
  gradingCriteriaContent: EditorDocument | null;
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
  content: EditorDocument;
  audioFileId: number | null;
  audioFile: FileMetadata | null;
  playbackMode: PlaybackMode;
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
