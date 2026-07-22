import axiosClient from "./axiosClient";
import type { ScheduleRequest, ScheduleResponse, ScheduleType } from "../types/schedule";

export const scheduleApi = {
  // ── Owner: all schedules in center ──
  findAllForOwner: async (): Promise<ScheduleResponse[]> => {
    const response = await axiosClient.get("/owner/schedules/me");
    return response.data;
  },

  // ── Owner: schedules by class ──
  findAllByClass: async (classId: number): Promise<ScheduleResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/schedules`,
    );
    return response.data;
  },

  // ── Owner: schedules by teacher ──
  findAllByTeacher: async (
    teacherUserId: number,
  ): Promise<ScheduleResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/0/schedules/teacher/${teacherUserId}`,
    );
    return response.data;
  },

  create: async (
    classId: number,
    request: ScheduleRequest,
  ): Promise<ScheduleResponse> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/schedules`,
      request,
    );
    return response.data;
  },

  update: async (
    classId: number,
    scheduleId: number,
    request: ScheduleRequest,
  ): Promise<ScheduleResponse> => {
    const response = await axiosClient.put(
      `/owner/classes/${classId}/schedules/${scheduleId}`,
      request,
    );
    return response.data;
  },

  delete: async (classId: number, scheduleId: number): Promise<void> => {
    await axiosClient.delete(
      `/owner/classes/${classId}/schedules/${scheduleId}`,
    );
  },

  updateType: async (
    classId: number,
    scheduleId: number,
    type: ScheduleType,
  ): Promise<ScheduleResponse> => {
    const response = await axiosClient.patch(
      `/owner/classes/${classId}/schedules/${scheduleId}/type`,
      type,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  },

  // ── Teacher: own schedule ──
  findMySchedulesAsTeacher: async (): Promise<ScheduleResponse[]> => {
    const response = await axiosClient.get("/teacher/schedules/me");
    return response.data;
  },

  // ── Student: own schedule ──
  findMySchedulesAsStudent: async (): Promise<ScheduleResponse[]> => {
    const response = await axiosClient.get("/student/schedules/me");
    return response.data;
  },
};
