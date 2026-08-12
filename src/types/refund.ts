import type { Money, PaymentMethod } from "./fee";

export type RefundStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PAID";

export interface RefundResponse {
  id: number;
  paymentId: number;
  centerId: number;
  amount: Money;
  reason: string;
  status: RefundStatus;
  refundMethod?: PaymentMethod;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
  requestedByUserId?: number;
  requestedByUserName?: string;
  approvedByUserId?: number;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  relatedEnrollmentId?: number;
  paymentReceiptNumber: string;
  paymentAmount: Money;
  studentFullName: string;
  studentPhoneNumber: string;
}

export interface RefundRequest {
  paymentId: number;
  amount: Money;
  reason: string;
  relatedEnrollmentId?: number;
}

export interface RefundDecisionRequest {
  approve: boolean;
  rejectedReason?: string;
}

export interface RefundPayoutRequest {
  refundMethod: PaymentMethod;
}
