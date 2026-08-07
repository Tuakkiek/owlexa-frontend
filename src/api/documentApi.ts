import axiosClient from "./axiosClient";
import type { StudentDocumentResponse } from "../types/document";

export interface StudentDocumentRequest {
  title: string;
  type: "PDF" | "VIDEO" | "OTHER";
  url: string;
  description?: string;
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

  // ── Owner: delete document ──
  deleteForClass: async (
    classId: number,
    documentId: number,
  ): Promise<void> => {
    await axiosClient.delete(
      `/owner/classes/${classId}/documents/${documentId}`,
    );
  },

  // ── Teacher: class documents ──
  findClassDocumentsAsTeacher: async (
    classId: number,
  ): Promise<StudentDocumentResponse[]> => {
    const response = await axiosClient.get(
      `/teacher/classes/${classId}/documents`,
    );
    return response.data;
  },

  // ── Teacher: upload document to class ──
  createForClassAsTeacher: async (
    classId: number,
    request: StudentDocumentRequest,
  ): Promise<StudentDocumentResponse> => {
    const response = await axiosClient.post(
      `/teacher/classes/${classId}/documents`,
      request,
    );
    return response.data;
  },

  // ── Teacher: delete document ──
  deleteForClassAsTeacher: async (
    classId: number,
    documentId: number,
  ): Promise<void> => {
    await axiosClient.delete(
      `/teacher/classes/${classId}/documents/${documentId}`,
    );
  },
};
