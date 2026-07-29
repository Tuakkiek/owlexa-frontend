import type { EditorDocument } from "../components/editor";

export interface GradingCriteriaRequest {
  name: string;
  content: EditorDocument;
}

export interface GradingCriteriaResponse {
  id: number;
  name: string;
  content: EditorDocument;
  createdAt: string;
  updatedAt: string;
}
