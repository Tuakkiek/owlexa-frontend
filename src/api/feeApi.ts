import axiosClient from "./axiosClient";
import type {
  FeeRecordResponse,
  CashPaymentRequest,
  PaymentResponse,
} from "../types/fee";

export interface FeeGenerateRequest {
  month: string;
  dueDate: string;
}

export const feeApi = {
  getOverdueFees: async (roleName?: string): Promise<FeeRecordResponse[]> => {
    // Use /cashier/ prefix for CASHIER role, /owner/ for others
    const prefix = roleName === "CASHIER" ? "/cashier" : "/owner";
    const response = await axiosClient.get(`${prefix}/fee-records/overdue`);
    return response.data;
  },

  findAllByClass: async (
    classId: number,
    month: string,
  ): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/fee-records`,
      {
        params: { month },
      },
    );
    return response.data;
  },

  generateFeeForClass: async (
    classId: number,
    request: FeeGenerateRequest,
  ): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.post(
      `/owner/classes/${classId}/fee-records/generate`,
      request,
    );
    return response.data;
  },

  collectCash: async (
    feeRecordId: number,
    request: CashPaymentRequest,
    roleName: string = "OWNER",
  ): Promise<PaymentResponse> => {
    // Use /owner/ or /cashier/ prefix based on role
    const prefix = roleName === "CASHIER" ? "/cashier" : "/owner";
    const response = await axiosClient.post(
      `${prefix}/fee-record/${feeRecordId}/payments/cash`,
      request,
    );
    return response.data;
  },

  getMyFees: async (): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.get("/fee-records/me");
    return response.data;
  },

  getMyPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get("/student/payments/me");
    return response.data;
  },

  getOwnerPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get("/owner/payments");
    return response.data;
  },

  getCashierPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get("/cashier/payments");
    return response.data;
  },
};
