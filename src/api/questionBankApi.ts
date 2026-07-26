import axiosClient from "./axiosClient";
import type {
  PageResponse,
  QuestionRequest,
  QuestionResponse,
  QuestionSearchParams,
} from "../types/questionBank";

const BASE_URL = "/teacher/questions";

const buildParams = (params: QuestionSearchParams) => ({
  ...(params.search?.trim() ? { search: params.search.trim() } : {}),
  ...(params.type ? { type: params.type } : {}),
  ...(params.difficulty ? { difficulty: params.difficulty } : {}),
  ...(params.gradingCriteriaId
    ? { gradingCriteriaId: params.gradingCriteriaId }
    : {}),
  page: params.page ?? 0,
  size: params.size ?? 20,
});

export const questionBankApi = {
  findAll: async (
    params: QuestionSearchParams,
  ): Promise<PageResponse<QuestionResponse>> => {
    const response = await axiosClient.get(BASE_URL, {
      params: buildParams(params),
    });
    return response.data;
  },

  findById: async (questionId: number): Promise<QuestionResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${questionId}`);
    return response.data;
  },

  create: async (request: QuestionRequest): Promise<QuestionResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    questionId: number,
    request: QuestionRequest,
  ): Promise<QuestionResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${questionId}`, request);
    return response.data;
  },

  delete: async (questionId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${questionId}`);
  },
};
