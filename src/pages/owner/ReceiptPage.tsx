import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feeApi } from "../../api/feeApi";
import { useAuthStore } from "../../store/authStore";
import { formatMoney } from "../../utils/money";
import { PAYMENT_METHOD_LABELS, FEE_STATUS_LABELS } from "../../types/fee";
import type { PaymentResponse } from "../../types/fee";
import { Button } from "../../components/ui/Button";

const ReceiptPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const role = user?.roleName === "CASHIER" ? "cashier" : "owner";

  const load = useCallback(async () => {
    if (!paymentId) return;
    try {
      setLoading(true);
      const data = await feeApi.getReceipt(role, Number(paymentId));
      setPayment(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [paymentId, role]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="mx-auto max-w-2xl py-12 text-center text-gray-400">Đang tải biên lai...</div>;
  }
  if (!payment) {
    return <div className="mx-auto max-w-2xl py-12 text-center text-gray-400">Không tìm thấy biên lai.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block print:mb-4 print:text-center">
        <h1 className="text-xl font-bold">{payment.centerName || "Trung tâm"}</h1>
      </div>

      {/* Actions - hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-gray-900">Biên Lai</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>Quay lại</Button>
          <Button onClick={handlePrint}>In biên lai</Button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="rounded-card border border-surface-border bg-white p-8">
        {/* Header */}
        <div className="border-b border-surface-border pb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">{payment.centerName || "Trung tâm"}</h2>
          <p className="mt-2 text-3xl font-bold text-primary">{payment.receiptNumber}</p>
          <p className="mt-1 text-sm text-gray-500">Biên lai thu học phí</p>
        </div>

        {/* Body */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Học sinh:</span>
            <span className="font-semibold text-gray-900">{payment.studentFullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số điện thoại:</span>
            <span className="text-gray-700">{payment.studentPhoneNumber}</span>
          </div>
          {payment.courseName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Khóa học:</span>
              <span className="text-gray-700">{payment.courseName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Lớp:</span>
            <span className="text-gray-700">{payment.className}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Người thu:</span>
            <span className="text-gray-700">{payment.collectedByUserName || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phương thức:</span>
            <span className="text-gray-700">{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
          </div>
          <div className="flex justify-between border-t border-surface-border pt-3">
            <span className="text-gray-500">Ngày thanh toán:</span>
            <span className="text-gray-700">
              {new Date(payment.createdAt).toLocaleDateString("vi-VN")}{" "}
              {new Date(payment.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tổng học phí:</span>
            <span className="text-gray-700">{formatMoney(payment.feeRecordAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Đã thanh toán:</span>
            <span className="text-emerald-600">{formatMoney(payment.feeRecordPaidAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Còn lại:</span>
            <span className="text-red-600 font-semibold">{formatMoney(payment.feeRecordRemainingAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
            <span className="font-semibold text-gray-900">Số tiền thanh toán:</span>
            <span className="text-xl font-bold text-primary">{formatMoney(payment.amount)}</span>
          </div>
          <div className="text-center mt-2">
            <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${
              payment.feeRecordStatus === "PAID" ? "bg-emerald-50 text-emerald-700" :
              payment.feeRecordStatus === "OVERDUE" ? "bg-red-50 text-red-700" :
              "bg-blue-50 text-blue-700"
            }`}>
              {FEE_STATUS_LABELS[payment.feeRecordStatus]}
            </span>
          </div>
        </div>

        {payment.note && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium">Ghi chú:</span> {payment.note}
          </div>
        )}

        {/* Signature area */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t border-gray-300 pt-2 text-sm text-gray-500">Người nộp</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-300 pt-2 text-sm text-gray-500">Người thu</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
