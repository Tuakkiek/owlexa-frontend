import axiosClient from "./axiosClient";
import type {
  PageResponse,
  QuestionImportResultResponse,
  QuestionImportValidationResponse,
  QuestionRequest,
  QuestionResponse,
  QuestionSearchParams,
} from "../types/questionBank";

const BASE_URL = "/teacher/questions";

const buildParams = (params: QuestionSearchParams) => ({
  ...(params.search?.trim() ? { search: params.search.trim() } : {}),
  ...(params.collectionId ? { collectionId: params.collectionId } : {}),
  ...(params.sectionCode?.trim()
    ? { sectionCode: params.sectionCode.trim() }
    : {}),
  ...(params.type ? { type: params.type } : {}),
  ...(params.difficulty ? { difficulty: params.difficulty } : {}),
  ...(params.gradingCriteriaId
    ? { gradingCriteriaId: params.gradingCriteriaId }
    : {}),
  page: params.page ?? 0,
  size: params.size ?? 20,
  ...(params.sort ? { sort: params.sort } : {}),
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

  findSectionCodes: async (collectionId: number): Promise<string[]> => {
    const response = await axiosClient.get(`${BASE_URL}/section-codes`, {
      params: { collectionId },
    });
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

  bulkDelete: async (questionIds: number[]): Promise<void> => {
    await axiosClient.post(`${BASE_URL}/bulk-delete`, { questionIds });
  },

  validateImport: async (
    collectionId: number,
    json: string,
  ): Promise<QuestionImportValidationResponse> => {
    const response = await axiosClient.post(`${BASE_URL}/import/validate`, {
      collectionId,
      json,
    });
    return response.data;
  },

  importJson: async (
    collectionId: number,
    json: string,
  ): Promise<QuestionImportResultResponse> => {
    const response = await axiosClient.post(`${BASE_URL}/import`, {
      collectionId,
      json,
    });
    return response.data;
  },
};
