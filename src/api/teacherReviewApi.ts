import axiosClient from "./axiosClient";
import type {
  PageResponse,
  StudentReviewResultResponse,
  TeacherReviewDetailResponse,
  TeacherReviewQueueParams,
  TeacherReviewSummaryResponse,
  TeacherReviewUpdateRequest,
} from "../types/teacherReview";

const TEACHER_BASE_URL = "/teacher";
const STUDENT_BASE_URL = "/student";

const buildQueueParams = (params: TeacherReviewQueueParams = {}) => ({
  ...(params.reviewStatus ? { reviewStatus: params.reviewStatus } : {}),
  page: params.page ?? 0,
  size: params.size ?? 20,
});

export const teacherReviewApi = {
  createOrGetReview: async (
    attemptId: number,
  ): Promise<TeacherReviewDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/submission-attempts/${attemptId}/review`,
    );
    return response.data;
  },

  getReview: async (
    attemptId: number,
  ): Promise<TeacherReviewDetailResponse> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/submission-attempts/${attemptId}/review`,
    );
    return response.data;
  },

  updateReview: async (
    reviewId: number,
    request: TeacherReviewUpdateRequest,
  ): Promise<TeacherReviewDetailResponse> => {
    const response = await axiosClient.put(
      `${TEACHER_BASE_URL}/reviews/${reviewId}`,
      request,
    );
    return response.data;
  },

  finalizeReview: async (
    reviewId: number,
  ): Promise<TeacherReviewDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/reviews/${reviewId}/finalize`,
    );
    return response.data;
  },

  releaseReview: async (
    reviewId: number,
  ): Promise<TeacherReviewDetailResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/reviews/${reviewId}/release`,
    );
    return response.data;
  },

  findReviewQueue: async (
    assignmentId: number,
    params: TeacherReviewQueueParams = {},
  ): Promise<PageResponse<TeacherReviewSummaryResponse>> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/assignments/${assignmentId}/reviews`,
      {
        params: buildQueueParams(params),
      },
    );
    return response.data;
  },

  getStudentReleasedResult: async (
    attemptId: number,
  ): Promise<StudentReviewResultResponse> => {
    const response = await axiosClient.get(
      `${STUDENT_BASE_URL}/submission-attempts/${attemptId}/result`,
    );
    return response.data;
  },
};
