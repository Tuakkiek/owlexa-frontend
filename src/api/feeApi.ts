import axiosClient from "./axiosClient";
import type {
  FeeRecordResponse,
  CashPaymentRequest,
  PaymentResponse,
  PaymentPage,
  RevenueSummary,
  BankTransferQrResponse,
} from "../types/fee";

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
    idempotencyKey?: string,
  ): Promise<PaymentResponse> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const response = await axiosClient.post(
      `/student/fee-record/${feeRecordId}/payments/qr`,
      null,
      { headers },
    );
    return response.data;
  },

  /** Gets the current pending payment for a fee record. Returns 204 (no content) if none exists. */
  getCurrentPendingPayment: async (
    feeRecordId: number,
  ): Promise<PaymentResponse | null> => {
    const response = await axiosClient.get(
      `/student/fee-record/${feeRecordId}/payments/pending`,
      { validateStatus: (status) => status === 200 || status === 204 },
    );
    return response.data || null;
  },

  /** Cancels a student's own pending payment. */
  cancelPayment: async (paymentId: number): Promise<PaymentResponse> => {
    const response = await axiosClient.post(
      `/student/payments/${paymentId}/cancel`,
    );
    return response.data;
  },

  /** Gets QR display data for a student-owned payment. */
  getStudentPaymentQr: async (
    paymentId: number,
  ): Promise<BankTransferQrResponse> => {
    const response = await axiosClient.get(`/student/payments/${paymentId}/qr`);
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
