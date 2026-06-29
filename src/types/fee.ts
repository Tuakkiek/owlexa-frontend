export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface FeeRecordResponse {
  id: number;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  centerId: number;
  classId: number;
  className: string;
  amount: number;
  paidAmount: number;
  month: string;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
}

export interface CashPaymentRequest {
  amount: number;
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
  amount: number;
  method: string;
  sepayRef?: string;
  note?: string;
  collectedByUserId: number;
  createdAt: string;
  feeRecordAmount: number;
  feeRecordPaidAmount: number;
  feeRecordRemainingAmount: number;
  feeRecordStatus: FeeStatus;
}
