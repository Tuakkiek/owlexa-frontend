export type FeeStatus = "UNPAID" | "PARTIAL" | "PAID";

export type Money = string;

export interface FeeRecordResponse {
  id: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  centerId: number;
  classId: number;
  className: string;
  amount: Money;
  paidAmount: Money;
  month: string;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
}

export interface CashPaymentRequest {
  amount: Money;
  note?: string;
}

export interface PaymentResponse {
  id: number;
  feeRecordId: number;
  centerId: number;
  classId: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  amount: Money;
  method: "CASH" | "SEPAY";
  sepayRef?: string;
  note?: string;
  collectedByUserId: number;
  createdAt: string;
  feeRecordAmount: Money;
  feeRecordPaidAmount: Money;
  feeRecordRemainingAmount: Money;
  feeRecordStatus: FeeStatus;
}
