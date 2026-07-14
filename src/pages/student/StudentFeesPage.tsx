import { useEffect, useState, useCallback, useMemo } from "react";
import { feeApi } from "../../api/feeApi";
import type { FeeRecordResponse, PaymentResponse } from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

const StudentFeesPage = () => {
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);

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
                    onClick={() =>
                      setSelectedFeeId(
                        selectedFeeId === record.id ? null : record.id,
                      )
                    }
                    className="rounded-lg w-full border border-gray-300 py-1 text-xs font-medium"
                  >
                    {selectedFeeId === record.id ? "Đóng" : "Thanh toán QR"}
                  </button>

                  {/* QR Code Display */}
                  {selectedFeeId === record.id && (
                    <div className="mt-3 rounded-lg border p-3 bg-gray-50">
                      <p className="text-xs font-bold mb-2 text-center uppercase">
                        Quét QR để thanh toán
                      </p>
                      <div className="flex justify-center rounded-lg border p-2 bg-white w-40 h-40 mx-auto items-center">
                        <span className="text-xs text-gray-400">
                          QR Code Sepay
                        </span>
                      </div>
                      <p className="text-xs text-center mt-2">
                        Chuyển khoản: {formatMoney(String(remaining))}
                      </p>
                      <button
                        onClick={() => {
                          setIsPolling(true);
                        }}
                        className="mt-2 w-full rounded-lg border border-gray-300 py-1 text-xs"
                      >
                        Đã thanh toán
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
                  <p className="font-medium">
                    {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payment.method} {payment.note && `| ${payment.note}`}
                  </p>
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
