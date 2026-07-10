import axiosClient from './axiosClient';
import type { StudentRequest, StudentResponse, BulkStudentRequest, BulkStudentResult } from '../types/student';

const BASE_URL = '/owner/students';

export const studentApi = {
  findAll: async (): Promise<StudentResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  create: async (request: StudentRequest): Promise<StudentResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  bulkCreate: async (request: BulkStudentRequest): Promise<BulkStudentResult[]> => {
    const response = await axiosClient.post(`${BASE_URL}/bulk`, request);
    return response.data;
  },

  update: async (studentId: number, request: StudentRequest): Promise<StudentResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${studentId}`, request);
    return response.data;
  },

  delete: async (studentId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${studentId}`);
  },
};
