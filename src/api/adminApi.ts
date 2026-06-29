import axiosClient from "./axiosClient";
import type { AdminStats } from "../types/admin";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await axiosClient.get<AdminStats>("/admin/stats");
    return response.data;
  },
};
