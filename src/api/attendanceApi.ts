import axiosClient from './axiosClient';
import type { AttendanceResponse, AttendanceMarkRequest } from '../types/attendance';

export const attendanceApi = {
  findAllBySchedule: async (scheduleId: number, date: string): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.get(`/attendance/schedules/${scheduleId}`, {
      params: { date }
    });
    return response.data;
  },

  markAttendance: async (scheduleId: number, request: AttendanceMarkRequest): Promise<AttendanceResponse[]> => {
    const response = await axiosClient.post(`/attendance/schedules/${scheduleId}`, request);
    return response.data;
  }
};
