import axiosClient from "./axiosClient";
import type { ClassRequest, ClassResponse } from "../types/class";
import type { TeacherClassStudents } from "../types/teacherClassStudents";

const BASE_URL = "/owner/classes";

export const classApi = {
  findAll: async (): Promise<ClassResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  findMyClasses: async (): Promise<ClassResponse[]> => {
    const response = await axiosClient.get("/teacher/classes/me");
    return response.data;
  },

  // ── Owner: classes with students ──
  findAllClassesWithStudentsForOwner: async (): Promise<
    TeacherClassStudents[]
  > => {
    const response = await axiosClient.get("/owner/classes/with-students");
    return response.data;
  },

  // ── Teacher: classes with students ──
  findMyClassesWithStudentsAsTeacher: async (): Promise<
    TeacherClassStudents[]
  > => {
    const response = await axiosClient.get("/teacher/classes/with-students");
    return response.data;
  },

  create: async (request: ClassRequest): Promise<ClassResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    classId: number,
    request: ClassRequest,
  ): Promise<ClassResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${classId}`, request);
    return response.data;
  },

  delete: async (classId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${classId}`);
  },

  // ── Lifecycle transitions ────────────────────────────────────────────────

  openForEnrollment: async (classId: number): Promise<ClassResponse> => {
    const response = await axiosClient.patch(`${BASE_URL}/${classId}/open`);
    return response.data;
  },

  startClass: async (classId: number): Promise<ClassResponse> => {
    const response = await axiosClient.patch(`${BASE_URL}/${classId}/start`);
    return response.data;
  },

  finishClass: async (classId: number): Promise<ClassResponse> => {
    const response = await axiosClient.patch(`${BASE_URL}/${classId}/finish`);
    return response.data;
  },

  archiveClass: async (classId: number): Promise<ClassResponse> => {
    const response = await axiosClient.patch(`${BASE_URL}/${classId}/archive`);
    return response.data;
  },

  cancelClass: async (classId: number): Promise<ClassResponse> => {
    const response = await axiosClient.patch(`${BASE_URL}/${classId}/cancel`);
    return response.data;
  },
};
