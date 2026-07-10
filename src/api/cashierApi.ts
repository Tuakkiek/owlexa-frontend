import axiosClient from "./axiosClient";
import type { CashierRequest, CashierResponse } from "../types/cashier";

const BASE_URL = "/owner/cashiers";

export const cashierApi = {
  findAll: async (): Promise<CashierResponse[]> => {
    const response = await axiosClient.get(BASE_URL);
    return response.data;
  },

  create: async (request: CashierRequest): Promise<CashierResponse> => {
    const response = await axiosClient.post(BASE_URL, request);
    return response.data;
  },

  update: async (
    cashierId: number,
    request: CashierRequest,
  ): Promise<CashierResponse> => {
    const response = await axiosClient.put(`${BASE_URL}/${cashierId}`, request);
    return response.data;
  },

  delete: async (cashierId: number): Promise<void> => {
    await axiosClient.delete(`${BASE_URL}/${cashierId}`);
  },
};
