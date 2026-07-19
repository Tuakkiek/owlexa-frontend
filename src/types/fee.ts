export type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PARTIAL: "Thanh toán một phần",
  PAID: "Đã thanh toán",
  OVERDUE: "Quá hạn",
};

export const FEE_STATUS_COLORS: Record<FeeStatus, string> = {
  UNPAID: "text-yellow-600 bg-yellow-50",
  PARTIAL: "text-blue-600 bg-blue-50",
  PAID: "text-emerald-600 bg-emerald-50",
  OVERDUE: "text-red-600 bg-red-50",
};

export type Money = string;

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QR_CODE" | "ONLINE" | "SEPAY";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  QR_CODE: "QR Code",
  ONLINE: "Online",
  SEPAY: "SePay",
};

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
  remainingAmount: Money;
  month: string;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
}

export interface CashPaymentRequest {
  amount: Money;
  method?: PaymentMethod;
  note?: string;
}

export interface PaymentResponse {
  id: number;
  receiptNumber: string;
  feeRecordId: number;
  centerId: number;
  centerName: string;
  classId: number;
  className: string;
  courseName: string;
  studentUserId: number;
  studentPhoneNumber: string;
  studentFullName: string;
  amount: Money;
  method: PaymentMethod;
  sepayRef?: string;
  note?: string;
  collectedByUserId: number;
  collectedByUserName: string;
  createdAt: string;
  feeRecordAmount: Money;
  feeRecordPaidAmount: Money;
  feeRecordRemainingAmount: Money;
  feeRecordStatus: FeeStatus;
}

export interface PaymentPage {
  content: PaymentResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface RevenueSummary {
  todayRevenue: number;
  yesterdayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  todayTransactionCount: number;
  thisMonthTransactionCount: number;
  averagePaymentAmount: number;
  highestPaymentAmount: number;
  lowestPaymentAmount: number;
  methodBreakdown: Record<string, number>;
  methodCounts: Record<string, number>;
}
