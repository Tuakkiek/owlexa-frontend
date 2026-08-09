import axiosClient from "./axiosClient";
import type {
  PageResponse,
  SaveSubmissionAnswersRequest,
  StudentAttemptDetailResponse,
  StudentAttemptSummaryResponse,
  TeacherAttemptDetailResponse,
  TeacherSubmissionSearchParams,
  TeacherSubmissionSummaryResponse,
} from "../types/submission";

const STUDENT_BASE_URL = "/student";
const TEACHER_BASE_URL = "/teacher";

const buildTeacherSubmissionParams = (
  params: TeacherSubmissionSearchParams = {},
) => ({
  page: params.page ?? 0,
  size: params.size ?? 20,
});

export const submissionApi = {
  startOrResumeAttempt: async (
    assignmentId: number,
    body?: { password: string },
  ): Promise<StudentAttemptDetailResponse> => {
    const response = await axiosClient.post(
      `${STUDENT_BASE_URL}/assignments/${assignmentId}/attempts/start`,
      body ?? null,
    );
    return response.data;
  },

  getAttemptHistory: async (
    assignmentId: number,
  ): Promise<StudentAttemptSummaryResponse[]> => {
    const response = await axiosClient.get(
      `${STUDENT_BASE_URL}/assignments/${assignmentId}/attempts`,
    );
    return response.data;
  },

  getAttemptDetail: async (
    attemptId: number,
  ): Promise<StudentAttemptDetailResponse> => {
    const response = await axiosClient.get(
      `${STUDENT_BASE_URL}/submission-attempts/${attemptId}`,
    );
    return response.data;
  },

  saveAnswers: async (
    attemptId: number,
    request: SaveSubmissionAnswersRequest,
  ): Promise<StudentAttemptDetailResponse> => {
    const response = await axiosClient.put(
      `${STUDENT_BASE_URL}/submission-attempts/${attemptId}/answers`,
      request,
    );
    return response.data;
  },

  saveAudioProgress: async (
    attemptId: number,
    request: { positionSeconds: number; completed?: boolean },
  ): Promise<StudentAttemptDetailResponse> => {
    const response = await axiosClient.put(
      `${STUDENT_BASE_URL}/submission-attempts/${attemptId}/audio-progress`,
      request,
    );
    return response.data;
  },

  submitAttempt: async (
    attemptId: number,
  ): Promise<StudentAttemptDetailResponse> => {
    const response = await axiosClient.post(
      `${STUDENT_BASE_URL}/submission-attempts/${attemptId}/submit`,
    );
    return response.data;
  },

  findAssignmentSubmissions: async (
    assignmentId: number,
    params: TeacherSubmissionSearchParams = {},
  ): Promise<PageResponse<TeacherSubmissionSummaryResponse>> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/assignments/${assignmentId}/submissions`,
      {
        params: buildTeacherSubmissionParams(params),
      },
    );
    return response.data;
  },

  findAttemptDetailForTeacher: async (
    attemptId: number,
  ): Promise<TeacherAttemptDetailResponse> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/submission-attempts/${attemptId}`,
    );
    return response.data;
  },
};
