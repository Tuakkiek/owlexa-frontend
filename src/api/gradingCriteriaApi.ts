import axiosClient from "./axiosClient";
import type {
  GradingCriteriaRequest,
  GradingCriteriaResponse,
} from "../types/gradingCriteria";

const BASE_URL = "/teacher/grading-criteria";

export const gradingCriteriaApi = {
  findAll: async (search?: string): Promise<GradingCriteriaResponse[]> => {
    const params = search?.trim() ? { search: search.trim() } : undefined;
    const response = await axiosClient.get(BASE_URL, { params });
    return response.data;
  },

  findById: async (criteriaId: number): Promise<GradingCriteriaResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${criteriaId}`);
    return response.data;
  },

  create: async (
    request: GradingCriteriaRequest,
  ): Promise<GradingCriteriaResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    criteriaId: number,
    request: GradingCriteriaRequest,
  ): Promise<GradingCriteriaResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${criteriaId}`, request);
    return response.data;
  },

  delete: async (criteriaId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${criteriaId}`);
  },
};
