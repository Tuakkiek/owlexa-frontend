import axiosClient from "./axiosClient";
import type { ClassRequest, ClassResponse, ClassStatus } from "../types/class";
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

  // ── Lifecycle: Update Status (any status → any status) ──────────────

  updateStatus: async (
    classId: number,
    newStatus: ClassStatus,
  ): Promise<ClassResponse> => {
    const response = await axiosClient.patch(
      `${BASE_URL}/${classId}/status`,
      newStatus,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return response.data;
  },
};
