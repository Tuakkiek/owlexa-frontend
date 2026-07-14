import axiosClient from "./axiosClient";
import type { LoginRequest, AuthResponse } from "../types/auth";

export interface SessionResponse {
  sessionId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export const authApi = {
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post("/auth/login", request);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post("/auth/logout");
  },

  getSessions: async (): Promise<SessionResponse[]> => {
    const response = await axiosClient.get("/auth/sessions");
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await axiosClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeAllSessions: async (): Promise<void> => {
    await axiosClient.delete("/auth/sessions");
  },

  registerStudent: async (request: {
    phoneNumber: string;
    password: string;
    fullName: string;
    email?: string;
  }): Promise<AuthResponse> => {
    const response = await axiosClient.post("/auth/register/student", request);
    return response.data;
  },

  registerOwner: async (request: {
    phoneNumber: string;
    password: string;
    fullName: string;
    email?: string;
  }): Promise<AuthResponse> => {
    const response = await axiosClient.post("/auth/register/owner", request);
    return response.data;
  },
};
