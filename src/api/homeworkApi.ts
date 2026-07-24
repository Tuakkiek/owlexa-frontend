import axiosClient from "./axiosClient";
import type { HomeworkTemplate, TeacherHomeworkTemplateSaveRequest, HomeworkType, HomeworkDifficulty } from "../types/homework";

const homeworkApi = {
  // Teacher: Get Template Library
  getTemplateLibrary: async (
    keyword?: string,
    type?: HomeworkType,
    difficulty?: HomeworkDifficulty,
    archived?: boolean
  ): Promise<HomeworkTemplate[]> => {
    const params: Record<string, any> = {};
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    if (difficulty) params.difficulty = difficulty;
    if (archived !== undefined) params.archived = archived;
    
    const res = await axiosClient.get<HomeworkTemplate[]>("/teacher/homework-templates/library", {
      params,
    });
    return res.data ?? [];
  },

  // Teacher: Create Template
  createTemplate: async (
    payload: TeacherHomeworkTemplateSaveRequest
  ): Promise<void> => {
    await axiosClient.post("/teacher/homework-templates", payload);
  },

  // Teacher: Update Template
  updateTemplate: async (
    templateId: number,
    payload: TeacherHomeworkTemplateSaveRequest
  ): Promise<void> => {
    await axiosClient.put(`/teacher/homework-templates/${templateId}`, payload);
  },

  // Teacher: Delete Template
  deleteTemplate: async (id: number): Promise<void> => {
    await axiosClient.delete(`/teacher/homework-templates/${id}`);
  },
  
  // Teacher: Duplicate Template
  duplicateTemplate: async (id: number): Promise<number> => {
    const res = await axiosClient.post(`/teacher/homework-templates/${id}/duplicate`);
    return res.data;
  },
  
  // ==========================================
  // TEACHER ASSIGNMENT API
  // ==========================================
  getAssignmentLibrary: async (params?: { keyword?: string; classId?: number; status?: string; type?: string }): Promise<any[]> => {
    const response = await axiosClient.get("/teacher/homework-assignments/library", { params });
    return response.data;
  },

  createAssignment: async (request: any): Promise<void> => {
    await axiosClient.post("/teacher/homework-assignments", request);
  },

  updateAssignment: async (id: number, request: any): Promise<void> => {
    await axiosClient.put(`/teacher/homework-assignments/${id}`, request);
  },

  deleteAssignment: async (id: number): Promise<void> => {
    await axiosClient.delete(`/teacher/homework-assignments/${id}`);
  },

  scheduleAssignment: async (id: number): Promise<void> => {
    await axiosClient.post(`/teacher/homework-assignments/${id}/schedule`);
  },

  releaseGrades: async (id: number): Promise<void> => {
    await axiosClient.post(`/teacher/homework-assignments/${id}/release-grades`);
  },

  closeAssignment: async (id: number): Promise<void> => {
    await axiosClient.post(`/teacher/homework-assignments/${id}/close`);
  },

  cancelAssignment: async (id: number): Promise<void> => {
    await axiosClient.post(`/teacher/homework-assignments/${id}/cancel`);
  },

  reopenAssignment: async (id: number): Promise<void> => {
    await axiosClient.post(`/teacher/homework-assignments/${id}/reopen`);
  },

  // ==========================================
  // OWNER HOMEWORK API
  // ==========================================
  getOwnerTemplateLibrary: async (
    keyword?: string,
    type?: string,
    difficulty?: string,
    page?: number,
    size?: number
  ): Promise<any> => {
    const params: Record<string, any> = {};
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    if (difficulty) params.difficulty = difficulty;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    const res = await axiosClient.get("/owner/homework-templates", { params });
    return res.data;
  },

  getOwnerAssignmentLibrary: async (
    keyword?: string,
    classId?: number,
    teacherId?: number,
    status?: string,
    page?: number,
    size?: number
  ): Promise<any> => {
    const params: Record<string, any> = {};
    if (keyword) params.keyword = keyword;
    if (classId) params.classId = classId;
    if (teacherId) params.teacherId = teacherId;
    if (status) params.status = status;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    const res = await axiosClient.get("/owner/homework-assignments", { params });
    return res.data;
  }
};

export default homeworkApi;
