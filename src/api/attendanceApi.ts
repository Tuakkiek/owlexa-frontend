import axiosClient from "./axiosClient";
import type {
  AttendanceResponse,
  AttendanceMarkRequest,
} from "../types/attendance";

export const attendanceApi = {
  // ── Teacher endpoints ──
  findAllBySchedule: async (
    scheduleId: number,
    date: string,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(
      `/teacher/attendance/schedules/${scheduleId}`,
      {
        params: { date },
      },
    );
    return response.data;
  },

  markAttendance: async (
    scheduleId: number,
    request: AttendanceMarkRequest,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.post(
      `/teacher/attendance/schedules/${scheduleId}`,
      request,
    );
    return response.data;
  },

  // ── Owner view-only endpoints ──
  findByScheduleOwner: async (
    scheduleId: number,
    date: string,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(
      `/owner/attendance/schedules/${scheduleId}`,
      {
        params: { date },
      },
    );
    return response.data;
  },

  findByClassAndDate: async (
    classId: number,
    date: string,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(
      `/owner/attendance/classes/${classId}`,
      {
        params: { date },
      },
    );
    return response.data;
  },

  findByClassAndDateRange: async (
    classId: number,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(
      `/owner/attendance/classes/${classId}/range`,
      {
        params: { startDate, endDate },
      },
    );
    return response.data;
  },

  getStats: async (
    classId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    classId: number;
    className: string;
    dateRangeLabel: string;
    totalStudents: number;
    statusCounts: Record<string, number>;
    statusPercentages: Record<string, number>;
  }> => {
    const response = await axiosClient.get(
      `/owner/attendance/classes/${classId}/stats`,
      {
        params: { startDate, endDate },
      },
    );
    return response.data;
  },

  // ── Student self-view endpoint ──
  findMyAttendances: async (
    classId?: number,
    date?: string,
  ): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get("/student/attendance", {
      params: { classId, date },
    });
    return response.data;
  },
};
