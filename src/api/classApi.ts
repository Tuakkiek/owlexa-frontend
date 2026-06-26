import axiosClient from './axiosClient';
import type { ClassRequest, ClassResponse } from '../types/class';

const BASE_URL = '/owner/classes';

export const classApi = {
  findAll: async (): Promise<ClassResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data?.data || response.data;
  },

  create: async (request: ClassRequest): Promise<ClassResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data?.data || response.data;
  },

  update: async (classId: number, request: ClassRequest): Promise<ClassResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${classId}`, request);
    return response.data?.data || response.data;
  },

  delete: async (classId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${classId}`);
  },
};
