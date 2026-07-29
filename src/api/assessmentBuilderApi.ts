import axiosClient from "./axiosClient";
import type {
  AssessmentDetailResponse,
  AssessmentListResponse,
  AssessmentRequest,
  AssessmentSearchParams,
  PageResponse,
} from "../types/assessmentBuilder";

const BASE_URL = "/teacher/assessments";

const buildParams = (params: AssessmentSearchParams) => ({
  ...(params.search?.trim() ? { search: params.search.trim() } : {}),
  ...(params.type ? { type: params.type } : {}),
  ...(params.status ? { status: params.status } : {}),
  page: params.page ?? 0,
  size: params.size ?? 20,
});

export const assessmentBuilderApi = {
  findAll: async (
    params: AssessmentSearchParams,
  ): Promise<PageResponse<AssessmentListResponse>> => {
    const response = await axiosClient.get(BASE_URL, {
      params: buildParams(params),
    });
    return response.data;
  },

  findById: async (assessmentId: number): Promise<AssessmentDetailResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${assessmentId}`);
    return response.data;
  },

  create: async (
    request: AssessmentRequest,
  ): Promise<AssessmentDetailResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    assessmentId: number,
    request: AssessmentRequest,
  ): Promise<AssessmentDetailResponse> => {
    const response = await axiosClient.put(
      `${BASE_URL}/${assessmentId}`,
      request,
    );
    return response.data;
  },

  publish: async (assessmentId: number): Promise<AssessmentDetailResponse> => {
    const response = await axiosClient.post(
      `${BASE_URL}/${assessmentId}/publish`,
    );
    return response.data;
  },

  archive: async (assessmentId: number): Promise<AssessmentDetailResponse> => {
    const response = await axiosClient.post(
      `${BASE_URL}/${assessmentId}/archive`,
    );
    return response.data;
  },

  delete: async (assessmentId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${assessmentId}`);
  },
};
