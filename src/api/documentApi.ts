import axiosClient from "./axiosClient";
import type { StudentDocumentResponse } from "../types/document";

export const documentApi = {
  getMyDocuments: async (): Promise<StudentDocumentResponse[]> => {
    const response = await axiosClient.get("/student/documents");
    return response.data?.data || response.data;
  },
};
