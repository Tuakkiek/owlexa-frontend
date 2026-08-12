import axiosClient from "./axiosClient";
import type {
  RefundResponse,
  RefundDecisionRequest,
  RefundPayoutRequest,
  RefundRequest,
  RefundStatus,
} from "../types/refund";

type RefundPortal = "owner" | "cashier";

const refundPrefix = (portal: RefundPortal) =>
  portal === "cashier" ? "/cashier" : "/owner";

export const refundApi = {
  requestRefund: async (
    request: RefundRequest,
    portal: RefundPortal = "owner",
  ): Promise<RefundResponse> => {
    const response = await axiosClient.post(`${refundPrefix(portal)}/refunds`, request);
    return response.data;
  },

  getRefunds: async (
    status?: RefundStatus,
    portal: RefundPortal = "owner",
  ): Promise<RefundResponse[]> => {
    const response = await axiosClient.get(`${refundPrefix(portal)}/refunds`, {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  decideRefund: async (
    refundId: number,
    request: RefundDecisionRequest,
    portal: RefundPortal = "owner",
  ): Promise<RefundResponse> => {
    const response = await axiosClient.patch(
      `${refundPrefix(portal)}/refunds/${refundId}/decision`,
      request,
    );
    return response.data;
  },

  payoutRefund: async (
    refundId: number,
    request: RefundPayoutRequest,
    portal: RefundPortal = "owner",
  ): Promise<RefundResponse> => {
    const response = await axiosClient.patch(
      `${refundPrefix(portal)}/refunds/${refundId}/payout`,
      request,
    );
    return response.data;
  },
};
