import axiosClient from "./axiosClient";
import type {
  TeachingTimeSlotResponse,
  TeachingTimeSlotRequest,
  QuickSetupRequest,
} from "../types/timeSlot";

const BASE_URL = "/owner/time-slots";

export const timeSlotApi = {
  findAllForOwner: async (): Promise<TeachingTimeSlotResponse[]> => {
    const res = await axiosClient.get<TeachingTimeSlotResponse[]>(BASE_URL);
    return res.data;
  },

  findAllActive: async (): Promise<TeachingTimeSlotResponse[]> => {
    const res = await axiosClient.get<TeachingTimeSlotResponse[]>(`${BASE_URL}/active`);
    return res.data;
  },

  create: async (data: TeachingTimeSlotRequest): Promise<TeachingTimeSlotResponse> => {
    const res = await axiosClient.post<TeachingTimeSlotResponse>(BASE_URL, data);
    return res.data;
  },

  quickSetup: async (data: QuickSetupRequest): Promise<TeachingTimeSlotResponse[]> => {
    const res = await axiosClient.post<TeachingTimeSlotResponse[]>(`${BASE_URL}/quick-setup`, data);
    return res.data;
  },

  update: async (id: number, data: TeachingTimeSlotRequest): Promise<TeachingTimeSlotResponse> => {
    const res = await axiosClient.put<TeachingTimeSlotResponse>(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  deleteOrDeactivate: async (id: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${id}`);
  },
};
