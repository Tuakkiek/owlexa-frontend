import axiosClient from "./axiosClient";
import type {
  AIGradingJobSummaryResponse,
  AIGradingResultResponse,
} from "../types/aiGrading";

const TEACHER_BASE_URL = "/teacher";

export const aiGradingApi = {
  startGrading: async (
    attemptId: number,
  ): Promise<AIGradingJobSummaryResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/submission-attempts/${attemptId}/ai-grading`,
    );
    return response.data;
  },

  retryJob: async (jobId: number): Promise<AIGradingJobSummaryResponse> => {
    const response = await axiosClient.post(
      `${TEACHER_BASE_URL}/ai-grading-jobs/${jobId}/retry`,
    );
    return response.data;
  },

  getJob: async (jobId: number): Promise<AIGradingJobSummaryResponse> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/ai-grading-jobs/${jobId}`,
    );
    return response.data;
  },

  getLatestResult: async (
    attemptId: number,
  ): Promise<AIGradingResultResponse> => {
    const response = await axiosClient.get(
      `${TEACHER_BASE_URL}/submission-attempts/${attemptId}/ai-grading-results`,
    );
    return response.data;
  },
};
