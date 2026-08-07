import axiosClient from "./axiosClient";
import type {
  ScheduleEventRequest,
  ScheduleEventResponse,
  ScheduleResponse,
  ScheduleRuleRequest,
  ScheduleRuleResponse,
} from "../types/schedule";

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

  findRulesByClass: async (classId: number): Promise<ScheduleRuleResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/schedule-rules`,
    );
    return response.data;
  },

  createRule: async (
    classId: number,
    request: ScheduleRuleRequest,
  ): Promise<ScheduleRuleResponse> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/schedule-rules`,
      request,
    );
    return response.data;
  },

  generateEvents: async (
    classId: number,
    ruleId: number,
  ): Promise<ScheduleEventResponse[]> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/schedule-rules/${ruleId}/generate`,
    );
    return response.data;
  },

  findEventsByClass: async (classId: number): Promise<ScheduleEventResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/schedule-events`,
    );
    return response.data;
  },

  createEvent: async (
    classId: number,
    request: ScheduleEventRequest,
  ): Promise<ScheduleEventResponse> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/schedule-events`,
      request,
    );
    return response.data;
  },

  updateEvent: async (
    classId: number,
    eventId: number,
    request: ScheduleEventRequest,
  ): Promise<ScheduleEventResponse> => {
    const response = await axiosClient.put(
      `/owner/classes/${classId}/schedule-events/${eventId}`,
      request,
    );
    return response.data;
  },

  cancelEvent: async (
    classId: number,
    eventId: number,
  ): Promise<ScheduleEventResponse> => {
    const response = await axiosClient.patch(
      `/owner/classes/${classId}/schedule-events/${eventId}/cancel`,
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
