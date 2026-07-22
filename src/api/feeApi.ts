import axiosClient from "./axiosClient";
import type {
  FeeRecordResponse,
  CashPaymentRequest,
  PaymentResponse,
  PaymentPage,
  RevenueSummary,
  BankTransferQrResponse,
} from "../types/fee";

export interface FeeGenerateRequest {
  month: string;
  dueDate: string;
}

export interface PaymentFilterParams {
  student?: string;
  cashierId?: number;
  method?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const feeApi = {
  getOverdueFees: async (roleName?: string): Promise<FeeRecordResponse[]> => {
    const prefix = roleName === "CASHIER" ? "/cashier" : "/owner";
    const response = await axiosClient.get(`${prefix}/fee-records/overdue`);
    return response.data;
  },

  getPendingFees: async (roleName?: string): Promise<FeeRecordResponse[]> => {
    const prefix = roleName === "CASHIER" ? "/cashier" : "/owner";
    const response = await axiosClient.get(`${prefix}/fee-records/pending`);
    return response.data;
  },

  findAllByClass: async (
    classId: number,
    month: string,
  ): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.get(
      `/owner/classes/${classId}/fee-records`,
      { params: { month } },
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
  ): Promise<PaymentResponse> => {
    const response = await axiosClient.post(
      `/cashier/fee-record/${feeRecordId}/payments/cash`,
      request,
    );
    return response.data;
  },

  createBankTransfer: async (
    feeRecordId: number,
    request: CashPaymentRequest,
  ): Promise<PaymentResponse> => {
    const response = await axiosClient.post(
      `/cashier/fee-record/${feeRecordId}/payments/bank-transfer`,
      request,
    );
    return response.data;
  },

  getPaymentQr: async (paymentId: number): Promise<BankTransferQrResponse> => {
    const response = await axiosClient.get(`/cashier/payments/${paymentId}/qr`);
    return response.data;
  },

  // ── Student self-service QR ───────────────────────────────────────────

  /** Creates a QR payment for the FULL remaining balance. No amount parameter — backend is the source of truth. */
  createStudentQrPayment: async (
    feeRecordId: number,
  ): Promise<PaymentResponse> => {
    const response = await axiosClient.post(
      `/student/fee-record/${feeRecordId}/payments/qr`,
    );
    return response.data;
  },

  /** Gets QR display data for a student-owned payment. */
  getStudentPaymentQr: async (
    paymentId: number,
  ): Promise<BankTransferQrResponse> => {
    const response = await axiosClient.get(
      `/student/payments/${paymentId}/qr`,
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

  getPaymentsPaginated: async (
    role: "owner" | "cashier",
    params: PaymentFilterParams = {},
  ): Promise<PaymentPage> => {
    const prefix = role === "cashier" ? "/cashier" : "/owner";
    const response = await axiosClient.get(`${prefix}/payments`, { params });
    return response.data;
  },

  getReceipt: async (
    role: "owner" | "cashier",
    paymentId: number,
  ): Promise<PaymentResponse> => {
    const prefix = role === "cashier" ? "/cashier" : "/owner";
    const response = await axiosClient.get(
      `${prefix}/payments/${paymentId}/receipt`,
    );
    return response.data;
  },

  getRevenueSummary: async (
    role: "owner" | "cashier",
  ): Promise<RevenueSummary> => {
    const prefix = role === "cashier" ? "/cashier" : "/owner";
    const response = await axiosClient.get(`${prefix}/dashboard/revenue`);
    return response.data;
  },

  // Legacy - kept for backward compatibility
  getOwnerPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get("/owner/payments/all");
    return response.data;
  },

  getCashierPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get("/cashier/payments/all");
    return response.data;
  },
};
