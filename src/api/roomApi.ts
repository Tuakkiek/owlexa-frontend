import axiosClient from "./axiosClient";
import type { RoomRequest, RoomResponse } from "../types/room";

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
