import { useEffect, useState, useCallback, useMemo } from "react";
import { feeApi } from "../../api/feeApi";
import type {
  FeeRecordResponse,
  PaymentResponse,
  BankTransferQrResponse,
} from "../../types/fee";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

const StudentFeesPage = () => {
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [qrCache, setQrCache] = useState<
    Record<number, BankTransferQrResponse | null>
  >({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [feesData, paymentsData] = await Promise.all([
        feeApi.getMyFees(),
        feeApi.getMyPayments(),
      ]);
      setFees(feesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Failed to load student fees and payments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling khi user đã bấm "Thanh toán" để cập nhật trạng thái
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(async () => {
      try {
        const feesData = await feeApi.getMyFees();
        setFees(feesData);

        // Nếu tất cả hóa đơn đã thanh toán, dừng polling
        if (feesData.every((f) => f.status === "PAID")) {
          setIsPolling(false);
          setSelectedFeeId(null);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPolling]);

  // ── QR: fetch or create VietQR for a fee record ──────────────────────
  const loadQrForFee = useCallback(
    async (record: FeeRecordResponse) => {
      // Find a pending bank-transfer/SEPAY payment for this fee record
      const pendingPayment = payments.find(
        (p) =>
          p.feeRecordId === record.id &&
          p.status === "PENDING" &&
          (p.method === "BANK_TRANSFER" || p.method === "SEPAY"),
      );

      // Helper: fetch QR given a payment ID
      const fetchQr = async (paymentId: number) => {
        try {
          const qr = await feeApi.getStudentPaymentQr(paymentId);
          setQrCache((prev) => ({ ...prev, [record.id]: qr }));
        } catch {
          setQrCache((prev) => ({ ...prev, [record.id]: null }));
        }
      };

      if (pendingPayment) {
        // Existing PENDING payment — fetch its QR
        await fetchQr(pendingPayment.id);
      } else {
        // No pending payment exists — create one for the FULL remaining balance
        try {
          const newPayment = await feeApi.createStudentQrPayment(record.id);
          // Refresh the payments list so subsequent renders see the new payment
          const updatedPayments = await feeApi.getMyPayments();
          setPayments(updatedPayments);
          await fetchQr(newPayment.id);
        } catch {
          setQrCache((prev) => ({ ...prev, [record.id]: null }));
        }
      }
    },
    [payments],
  );

  // Load QR when a fee is selected
  const handleSelectFee = useCallback(
    (recordId: number) => {
      if (selectedFeeId === recordId) {
        setSelectedFeeId(null);
        return;
      }
      setSelectedFeeId(recordId);
      const record = fees.find((f) => f.id === recordId);
      if (record && !qrCache[recordId]) {
        loadQrForFee(record);
      }
    },
    [selectedFeeId, fees, qrCache, loadQrForFee],
  );

  // Get transfer content for display (preserves SePay compatibility)
  const getTransferContentForFee = (record: FeeRecordResponse): string => {
    const pendingPayment = payments.find(
      (p) =>
        p.feeRecordId === record.id &&
        p.status === "PENDING" &&
        (p.method === "BANK_TRANSFER" || p.method === "SEPAY"),
    );
    if (pendingPayment?.sepayRef) {
      return pendingPayment.sepayRef + " thanh toan hoc phi";
    }
    return "OWX" + String(record.id).padStart(6, "0") + " thanh toan hoc phi";
  };

  const unpaidFees = useMemo(
    () => fees.filter((f) => f.status !== "PAID"),
    [fees],
  );
  const paidFees = useMemo(
    () => fees.filter((f) => f.status === "PAID"),
    [fees],
  );

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div>
          <h1 className="text-xl font-bold">Học phí & Thanh toán</h1>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs disabled:opacity-50"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* SUSPENDED enrollment warning */}
      {fees.some((f) => f.enrollmentStatus === "SUSPENDED") && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-bold text-red-700">
            ⚠️ Tài khoản của bạn đang bị tạm dừng
          </p>
          <p className="mt-1 text-red-600">
            Bạn có hóa đơn chưa thanh toán quá hạn. Vui lòng thanh toán để tiếp
            tục tham gia lớp học. Lịch sử học tập, điểm danh và bài tập của bạn
            vẫn được giữ nguyên.
          </p>
        </div>
      )}

      {/* Hóa đơn chưa thanh toán */}
      {unpaidFees.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">
            Hóa đơn chưa thanh toán ({unpaidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpaidFees.map((record) => {
              const remaining = remainingBalance(record);

              return (
                <div key={record.id} className="rounded-lg border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs uppercase text-gray-500">
                        {record.className}
                      </p>
                      <h3 className="font-bold">{record.month}</h3>
                    </div>
                    <span className="rounded-lg text-xs border px-1.5 py-0.5">
                      {record.status === "PARTIAL"
                        ? "Đã trả một phần"
                        : "Chưa trả"}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-dashed pt-2 mb-3">
                    <div className="flex justify-between">
                      <span>Tổng học phí:</span>
                      <span>{formatMoney(record.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đã thanh toán:</span>
                      <span>{formatMoney(record.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Còn nợ:</span>
                      <span>{formatMoney(String(remaining))}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Hạn: {record.dueDate}
                  </div>

                  <button
                    onClick={() => handleSelectFee(record.id)}
                    className="rounded-lg w-full border border-gray-300 py-1 text-xs font-medium"
                  >
                    {selectedFeeId === record.id ? "Đóng" : "Thanh toán QR"}
                  </button>

                  {/* QR Code Display — VietQR from backend */}
                  {selectedFeeId === record.id && (
                    <div className="mt-3 rounded-lg border p-3 bg-gray-50">
                      {qrCache[record.id]?.qrImage ? (
                        <>
                          <p className="text-xs font-bold mb-2 text-center uppercase">
                            Quét QR để thanh toán
                          </p>
                          <div className="flex justify-center rounded-lg border bg-white p-2">
                            <img
                              src={qrCache[record.id]!.qrImage!}
                              alt={`VietQR ${qrCache[record.id]!.paymentCode}`}
                              width={160}
                              height={160}
                              className="block"
                            />
                          </div>
                          <p className="text-xs text-center mt-2">
                            Số tiền:{" "}
                            {formatMoney(String(qrCache[record.id]!.amount))}
                          </p>
                          <p className="text-xs text-center text-gray-400 font-mono break-all">
                            ND: {getTransferContentForFee(record)}
                          </p>
                        </>
                      ) : qrCache[record.id] === null ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500">
                            Không thể tạo mã QR. Vui lòng thử lại sau.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-400">
                            Đang tải mã QR...
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-center text-gray-400 mt-1">
                        Mã QR hết hạn sau 30 phút. Sau khi chuyển khoản, nhấn
                        nút bên dưới để kiểm tra.
                      </p>
                      <button
                        onClick={() => {
                          setIsPolling(true);
                        }}
                        className="mt-2 w-full rounded-lg border border-gray-300 py-1.5 text-xs font-medium hover:bg-gray-100"
                      >
                        Đã thanh toán — Kiểm tra
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hóa đơn đã thanh toán */}
      {paidFees.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">
            Hóa đơn đã thanh toán ({paidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paidFees.map((record) => (
              <div key={record.id} className="rounded-lg border p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      {record.className}
                    </p>
                    <h3 className="font-bold">{record.month}</h3>
                  </div>
                  <span className="rounded-lg text-xs border border-gray-200 px-1.5 py-0.5">
                    Đã trả
                  </span>
                </div>

                <div className="space-y-1 border-t border-dashed pt-2">
                  <div className="flex justify-between">
                    <span>Tổng học phí:</span>
                    <span>{formatMoney(record.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã thanh toán:</span>
                    <span>{formatMoney(record.paidAmount)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Hạn: {record.dueDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lịch sử thanh toán */}
      {payments.length > 0 && (
        <section className="rounded-lg border p-4">
          <h2 className="font-bold mb-3 border-b pb-1">Lịch sử thanh toán</h2>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border-b pb-2 last:border-0 last:pb-0 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    {payment.note && ` — ${payment.note}`}
                  </p>
                  {payment.sepayRef && (
                    <p className="text-xs font-mono text-gray-400">
                      Mã: {payment.sepayRef}
                    </p>
                  )}
                </div>
                <div className="font-bold">{formatMoney(payment.amount)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trạng thái trống */}
      {!isLoading && fees.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          <h3 className="font-bold">Không có hóa đơn</h3>
          <p className="text-xs mt-1">
            Bạn đã thanh toán hết học phí hoặc chưa có hóa đơn nào.
          </p>
        </div>
      )}

      {/* Polling status */}
      {isPolling && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-600">
          Đang kiểm tra trạng thái thanh toán trên hệ thống...
        </div>
      )}
    </div>
  );
};

export default StudentFeesPage;
