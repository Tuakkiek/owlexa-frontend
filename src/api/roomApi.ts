import axiosClient from "./axiosClient";
import type { RoomRequest, RoomResponse, RoomScheduleSummaryResponse, RoomDeleteValidationResponse } from "../types/room";

const BASE_URL = "/owner/rooms";

export const roomApi = {
  findAll: async (): Promise<RoomResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  findById: async (roomId: number): Promise<RoomResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${roomId}`);
    return response.data;
  },

  getScheduleSummary: async (roomId: number): Promise<RoomScheduleSummaryResponse[]> => {
    const response = await axiosClient.get(`${BASE_URL}/${roomId}/schedule-summary`);
    return response.data;
  },

  validateDelete: async (roomId: number): Promise<RoomDeleteValidationResponse> => {
    const response = await axiosClient.get(`${BASE_URL}/${roomId}/delete-validation`);
    return response.data;
  },

  create: async (request: RoomRequest): Promise<RoomResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    roomId: number,
    request: RoomRequest,
  ): Promise<RoomResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${roomId}`, request);
    return response.data;
  },

  delete: async (roomId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${roomId}`);
  },
};
