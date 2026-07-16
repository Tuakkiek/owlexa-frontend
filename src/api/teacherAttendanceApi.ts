import axiosClient from "./axiosClient";
import type {
  TeacherAttendanceMarkRequest,
  TeacherAttendanceResponse,
  TeacherAttendanceStatus,
} from "../types/teacherAttendance";

const BASE_URL = "/owner/teacher-attendance";

export const teacherAttendanceApi = {
  /** Batch mark teacher attendance for a date */
  mark: async (
    request: TeacherAttendanceMarkRequest,
  ): Promise<TeacherAttendanceResponse[]> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  /** Query teacher attendance with filters */
  findAll: async (params?: {
    teacherId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TeacherAttendanceResponse[]> => {
    const response = await axiosClient.get(BASE_URL, { params });
    return response.data;
  },

  /** Get a single record */
  findById: async (id: number): Promise<TeacherAttendanceResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /** Update a record */
  update: async (
    id: number,
    status: TeacherAttendanceStatus,
    note?: string,
  ): Promise<TeacherAttendanceResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${id}`, null, {
      params: { status, note },
    });
    return response.data;
  },

  /** Delete a record */
  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${id}`);
  },
};
