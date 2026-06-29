export type DocumentType = "PDF" | "VIDEO" | "OTHER";

export interface StudentDocumentResponse {
  id: number;
  title: string;
  type: DocumentType;
  uploadedAt: string;
  url: string;
  classId: number;
  className: string;
}
