import { Link } from "react-router-dom";
import { X, Receipt, AlertCircle, ArrowRightLeft, User, BookOpen, Clock } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentResponse,
  type PaymentStatus,
} from "../../../../types/fee";
import { formatMoney } from "../../../../utils/money";
import { Badge, ErrorBanner } from "../../../../components/ui/SharedComponents";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";

interface PaymentDetailDrawerProps {
  payment: PaymentResponse | null;
  isOpen: boolean;
  onClose: () => void;
  // Refund state
  refundAmount: string;
  refundReason: string;
  actionLoading: boolean;
  actionError: string;
  onRefundAmountChange: (val: string) => void;
  onRefundReasonChange: (val: string) => void;
  onConfirmRefund: () => void;
  canRefundPayment: (payment: PaymentResponse) => boolean;
  receiptPath: (paymentId: number) => string;
}

const paymentStatusVariants: Record<
  PaymentStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  PENDING: "warning",
  ACTIVE: "success",
  VOIDED: "error",
  EXPIRED: "default",
};

export const PaymentDetailDrawer = ({
  payment,
  isOpen,
  onClose,
  refundAmount,
  refundReason,
  actionLoading,
  actionError,
  onRefundAmountChange,
  onRefundReasonChange,
  onConfirmRefund,
  canRefundPayment,
  receiptPath,
}: PaymentDetailDrawerProps) => {
  if (!payment) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết giao dịch</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Amount and Status Hero */}
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold text-gray-900">
              {formatMoney(payment.amount)}
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant={paymentStatusVariants[payment.status]}>
                {PAYMENT_STATUS_LABELS[payment.status]}
              </Badge>
              <Badge variant="default">
                {PAYMENT_METHOD_LABELS[payment.method]}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 font-mono">
              {payment.receiptNumber}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-6">
            {/* Student Info */}
            <div className="flex gap-3">
              <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary h-fit">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{payment.studentFullName}</div>
                <div className="text-sm text-gray-500">{payment.studentPhoneNumber || "Chưa cập nhật SĐT"}</div>
              </div>
            </div>

            {/* Class Info */}
            <div className="flex gap-3">
              <div className="mt-1 p-2 bg-blue-100 rounded-lg text-blue-600 h-fit">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{payment.className || "Không có lớp"}</div>
                <div className="text-sm text-gray-500">{payment.courseName || "-"}</div>
              </div>
            </div>

            {/* Time Info */}
            <div className="flex gap-3">
              <div className="mt-1 p-2 bg-purple-100 rounded-lg text-purple-600 h-fit">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {(() => {
                    const d = new Date(payment.createdAt);
                    return `${d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
                  })()}
                </div>
                <div className="text-sm text-gray-500">
                  Người thu: {payment.collectedByUserName || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* SePay Ref */}
          {payment.sepayRef && (
            <div className="p-4 bg-surface-page rounded-card border border-surface-border">
              <div className="text-xs text-gray-500 mb-1">Mã chuyển khoản (SePay)</div>
              <div className="font-mono text-sm text-gray-900">{payment.sepayRef}</div>
            </div>
          )}

          {/* Note */}
          {payment.note && (
            <div className="p-4 bg-yellow-50 rounded-card border border-yellow-100">
              <div className="flex items-center gap-2 text-yellow-800 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Ghi chú</span>
              </div>
              <div className="text-sm text-yellow-700">{payment.note}</div>
            </div>
          )}

          {/* Refund Section */}
          {canRefundPayment(payment) && (
            <div className="border-t border-surface-border pt-6 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                Hoàn tiền giao dịch này
              </h3>
              
              {actionError && <ErrorBanner message={actionError} />}
              
              <Input
                type="number"
                min="0"
                label="Số tiền hoàn"
                placeholder="Nhập số tiền..."
                value={refundAmount}
                onChange={(e) => onRefundAmountChange(e.target.value)}
              />
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Lý do hoàn tiền</label>
                <textarea
                  className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
                  rows={3}
                  placeholder="Nhập lý do hoàn tiền..."
                  value={refundReason}
                  onChange={(e) => onRefundReasonChange(e.target.value)}
                />
              </div>

              <Button
                variant="danger"
                className="w-full"
                onClick={onConfirmRefund}
                isLoading={actionLoading}
                disabled={!refundAmount || Number(refundAmount) <= 0 || !refundReason.trim()}
              >
                Xác nhận hoàn tiền
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border bg-surface-page flex gap-3">
          <Link to={receiptPath(payment.id)} className="flex-1">
            <Button variant="secondary" className="w-full">
              <Receipt className="mr-2 h-4 w-4" /> Xem biên lai
            </Button>
          </Link>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Đóng
          </Button>
        </div>
      </div>
    </>
  );
};
