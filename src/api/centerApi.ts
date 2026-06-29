import axiosClient from "./axiosClient";
import type { CenterRequest, CenterResponse } from "../types/center";

const BASE_URL = "/owner/centers";

export const centerApi = {
  findAll: async (): Promise<CenterResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data?.data || response.data;
  },

  create: async (request: CenterRequest): Promise<CenterResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data?.data || response.data;
  },

  update: async (
    centerId: number,
    request: CenterRequest,
  ): Promise<CenterResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${centerId}`, request);
    return response.data?.data || response.data;
  },

  delete: async (centerId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${centerId}`);
  },
};
