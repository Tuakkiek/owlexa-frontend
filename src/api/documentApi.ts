import axiosClient from "./axiosClient";
import type { StudentDocumentResponse } from "../types/document";

export interface StudentDocumentRequest {
  title: string;
  type: "PDF" | "VIDEO" | "OTHER";
  url: string;
}

export const documentApi = {
  // ── Student: own documents ──
  getMyDocuments: async (): Promise<StudentDocumentResponse[]> => {
    const response = await axiosClient.get("/student/documents");
    return response.data;
  },

  // ── Owner: class documents ──
  findClassDocuments: async (
    classId: number,
  ): Promise<StudentDocumentResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/documents`,
    );
    return response.data;
  },

  // ── Owner: upload document to class ──
  createForClass: async (
    classId: number,
    request: StudentDocumentRequest,
  ): Promise<StudentDocumentResponse> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/documents`,
      request,
    );
    return response.data;
  },
};
