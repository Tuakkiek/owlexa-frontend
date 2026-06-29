import axiosClient from './axiosClient';
import type { TeacherRequest, TeacherResponse, BulkTeacherRequest, BulkTeacherResult } from '../types/teacher';

const BASE_URL = '/owner/teachers';

export const teacherApi = {
  findAll: async (): Promise<TeacherResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    // Assuming backend returns a raw array or wrapped in { data: [] }
    return response.data?.data || response.data;
  },

  create: async (request: TeacherRequest): Promise<TeacherResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data?.data || response.data;
  },

  bulkCreate: async (request: BulkTeacherRequest): Promise<BulkTeacherResult[]> => {
    const response = await axiosClient.post(`${BASE_URL}/bulk`, request);
    return response.data?.data || response.data;
  },

  update: async (teacherId: number, request: TeacherRequest): Promise<TeacherResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${teacherId}`, request);
    return response.data?.data || response.data;
  },

  delete: async (teacherId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${teacherId}`);
  },
};
