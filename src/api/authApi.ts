import axiosClient from './axiosClient';
import type { LoginRequest, AuthResponse } from '../types/auth';

export const authApi = {
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', request);
    return response.data?.data || response.data;
  },
  
  logout: async (): Promise<void> => {
    await axiosClient.post('/auth/logout');
  }
};
