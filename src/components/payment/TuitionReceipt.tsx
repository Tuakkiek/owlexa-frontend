import React from "react";
import { Printer, ArrowLeft, TriangleAlert } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  FEE_STATUS_LABELS,
  type PaymentResponse,
  type PaymentHistoryResponse,
} from "../../types/fee";
import { formatMoney } from "../../utils/money";
import { Button } from "../ui/Button";

export interface TuitionReceiptProps {
  payment: PaymentResponse | PaymentHistoryResponse;
  onBack?: () => void;
  onPrint?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const TuitionReceipt: React.FC<TuitionReceiptProps> = ({
  payment,
  onBack,
  onPrint,
  onClose,
  isModal = false,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const receiptNum =
    payment.receiptNumber ||
    ("paymentId" in payment && payment.paymentId
      ? `RCP-${payment.paymentId}`
      : `RCP-${payment.id}`);

  const createdAtFormatted = payment.createdAt
    ? `${new Date(payment.createdAt).toLocaleDateString("vi-VN")} ${new Date(
        payment.createdAt
      ).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "-";

  // Check if there is an actual staff collector (not student self-pay)
  const hasCollector = Boolean(
    payment.collectedByUserName &&
      payment.collectedByUserName.trim() !== "" &&
      payment.collectedByUserName.trim().toLowerCase() !==
        payment.studentFullName?.trim().toLowerCase()
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Action Bar - hidden when printing */}
      {!isModal && (
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold text-gray-900">Biên Lai Thu Học Phí</h1>
          <div className="flex gap-2">
            {onBack && (
              <Button variant="secondary" size="sm" onClick={onBack}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
              </Button>
            )}
            <Button onClick={handlePrint} size="sm">
              <Printer className="mr-1.5 h-4 w-4" /> In biên lai
            </Button>
          </div>
        </div>
      )}

      {/* Main Printable Receipt Card - Pure Black & White Theme */}
      <div
        id="printable-receipt"
        className="rounded-card border border-gray-300 bg-white p-6 sm:p-8 shadow-xs text-gray-900 transition-all"
      >
        {/* Header: Center Name & Title */}
        <div className="border-b border-gray-300 pb-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-gray-900">
            {payment.centerName || "Trung Tâm Đào Tạo Owlexa"}
          </h2>
          <h3 className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            BIÊN LAI THU HỌC PHÍ
          </h3>
          <p className="mt-1 font-mono text-xl font-bold text-gray-900">
            {receiptNum}
          </p>
          <p className="mt-1 text-xs text-gray-600">Ngày thu: {createdAtFormatted}</p>

          <div className="mt-3 flex justify-center flex-wrap gap-2 print:hidden">
            <span className="inline-flex items-center rounded-full border border-gray-400 bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-900">
              {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-400 bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-900">
              {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
            </span>
          </div>
        </div>

        {/* Duplicate Payment Alert (if applicable) */}
        {payment.status === "DUPLICATE_PAYMENT" && (
          <div className="mt-4 rounded-lg border border-gray-400 bg-gray-50 p-3.5 text-xs text-gray-900">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-0.5">
              <TriangleAlert className="h-4 w-4 shrink-0 text-gray-900" />
              <span>Thanh toán trùng</span>
            </div>
            Khoản tiền này được ghi nhận từ ngân hàng để đối soát và hoàn trả nếu cần, không cộng dồn thêm vào học phí.
          </div>
        )}

        {/* Student & Class Details Grid */}
        <div className="mt-6 space-y-3 text-sm divide-y divide-gray-200">
          <div className="flex justify-between pt-2">
            <span className="text-gray-600">Học sinh:</span>
            <span className="font-bold text-gray-900 text-right">
              {payment.studentFullName}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-gray-600">Số điện thoại:</span>
            <span className="font-medium text-gray-900 text-right">
              {payment.studentPhoneNumber || "-"}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-gray-600">Lớp học:</span>
            <span className="font-bold text-gray-900 text-right">
              {payment.className || "-"}
            </span>
          </div>

          {payment.courseName && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-600">Khóa học:</span>
              <span className="font-medium text-gray-900 text-right">
                {payment.courseName}
              </span>
            </div>
          )}

          {hasCollector && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-600">Người thu:</span>
              <span className="font-medium text-gray-900 text-right">
                {payment.collectedByUserName}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <span className="text-gray-600">Phương thức:</span>
            <span className="font-medium text-gray-900 text-right">
              {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
            </span>
          </div>

          {payment.sepayRef && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-600">Mã GD Ngân hàng:</span>
              <span className="font-mono font-bold text-gray-900 text-right">
                {payment.sepayRef}
              </span>
            </div>
          )}
        </div>

        {/* Financial Breakdown Container - Monochrome */}
        <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-300">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Tổng học phí hóa đơn:</span>
              <span className="font-bold text-gray-900">
                {formatMoney(payment.feeRecordAmount)}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Đã thanh toán trước đó:</span>
              <span className="font-bold text-gray-900">
                {formatMoney(payment.feeRecordPaidAmount)}
              </span>
            </div>

            {payment.feeRecordRemainingAmount !== undefined && (
              <div className="flex justify-between text-gray-700">
                <span>Còn lại:</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(payment.feeRecordRemainingAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-300 pt-3 mt-3">
              <span className="font-black text-gray-900 uppercase">
                Số tiền thanh toán:
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900">
                {formatMoney(payment.amount)}
              </span>
            </div>
          </div>

          <div className="text-center mt-3 pt-2 border-t border-gray-300 flex justify-center items-center gap-2">
            <span className="text-xs text-gray-600">Trạng thái học phí:</span>
            <span className="inline-flex items-center rounded-full border border-gray-400 bg-white px-3 py-0.5 text-xs font-semibold text-gray-900">
              {FEE_STATUS_LABELS[payment.feeRecordStatus] || payment.feeRecordStatus}
            </span>
          </div>
        </div>

        {/* Note (if present) */}
        {payment.note && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-900 border border-gray-300">
            <span className="font-bold">Ghi chú:</span> {payment.note}
          </div>
        )}

        {/* Signature Section */}
        {hasCollector ? (
          <div className="mt-10 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="font-bold text-gray-900 uppercase">Người nộp</div>
              <div className="text-gray-500 mt-0.5">(Ký & ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-gray-900">{payment.studentFullName}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900 uppercase">Người thu</div>
              <div className="text-gray-500 mt-0.5">(Ký & ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-gray-900">
                {payment.collectedByUserName}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 pt-4 border-t border-gray-300 flex justify-center text-center text-xs">
            <div className="w-1/2">
              <div className="font-bold text-gray-900 uppercase">Người nộp</div>
              <div className="text-gray-500 mt-0.5">(Ký & ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-gray-900">{payment.studentFullName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Actions (Bottom) - hidden when printing */}
      {isModal && (
        <div className="flex gap-3 pt-2 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" /> In biên lai
          </Button>
          {onClose && (
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
