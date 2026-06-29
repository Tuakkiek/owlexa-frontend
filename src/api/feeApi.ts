import axiosClient from './axiosClient';
import type { FeeRecordResponse, CashPaymentRequest, PaymentResponse } from '../types/fee';

export const feeApi = {
  getOverdueFees: async (): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.get('/owner/fee-records/overdue');
    return response.data?.data || response.data;
  },

  collectCash: async (feeRecordId: number, request: CashPaymentRequest, roleName: string = 'OWNER'): Promise<PaymentResponse> => {
    // Use /owner/ or /cashier/ prefix based on role
    const prefix = roleName === 'CASHIER' ? '/cashier' : '/owner';
    const response = await axiosClient.post(`${prefix}/fee-record/${feeRecordId}/payments/cash`, request);
    return response.data?.data || response.data;
  },

  getMyFees: async (): Promise<FeeRecordResponse[]> => {
    const response = await axiosClient.get('/fee-records/me');
    return response.data?.data || response.data;
  },

  getMyPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get('/student/payments/me');
    return response.data?.data || response.data;
  },

  getOwnerPayments: async (): Promise<PaymentResponse[]> => {
    const response = await axiosClient.get('/owner/payments');
    return response.data?.data || response.data;
  },
};
