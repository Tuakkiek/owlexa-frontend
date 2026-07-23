import axiosClient from "./axiosClient";
import type {
  EnrollmentRequest,
  EnrollmentResponse,
} from "../types/enrollment";

export const enrollmentApi = {
  findAllByClass: async (classId: number): Promise<EnrollmentResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/enrollments`,
    );
    return response.data;
  },

  findDroppedByClass: async (classId: number): Promise<EnrollmentResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/enrollments/dropped`,
    );
    return response.data;
  },

  enroll: async (
    classId: number,
    request: EnrollmentRequest,
  ): Promise<EnrollmentResponse> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/enrollments`,
      request,
    );
    return response.data;
  },

  drop: async (classId: number, studentUserId: number): Promise<void> => {
    await axiosClient.patch(
      `/owner/classes/${classId}/enrollments/${studentUserId}/drop`,
    );
  },

  approve: async (
    classId: number,
    studentUserId: number,
  ): Promise<EnrollmentResponse> => {
    const response = await axiosClient.patch(
      `/owner/classes/${classId}/enrollments/${studentUserId}/approve`,
    );
    return response.data;
  },

  reject: async (classId: number, studentUserId: number): Promise<void> => {
    await axiosClient.patch(
      `/owner/classes/${classId}/enrollments/${studentUserId}/reject`,
    );
  },

  suspend: async (classId: number, studentUserId: number): Promise<void> => {
    await axiosClient.patch(
      `/owner/classes/${classId}/enrollments/${studentUserId}/suspend`,
    );
  },

  reactivate: async (classId: number, studentUserId: number): Promise<void> => {
    await axiosClient.patch(
      `/owner/classes/${classId}/enrollments/${studentUserId}/reactivate`,
    );
  },
};
