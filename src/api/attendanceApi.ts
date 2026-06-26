import axiosClient from './axiosClient';
import type { AttendanceResponse, AttendanceMarkRequest } from '../types/attendance';

export const attendanceApi = {
  findAllBySchedule: async (scheduleId: number, sessionDate: string): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(`/attendance/schedules/${scheduleId}`, {
      params: { sessionDate }
    });
    return response.data?.data || response.data;
  },

  markAttendance: async (scheduleId: number, request: AttendanceMarkRequest): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.post(`/attendance/schedules/${scheduleId}`, request);
    return response.data?.data || response.data;
  }
};
