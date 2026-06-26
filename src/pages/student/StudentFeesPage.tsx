import { useEffect, useState, useCallback, useMemo } from "react";
import { feeApi } from "../../api/feeApi";
import type { FeeRecordResponse, PaymentResponse } from "../../types/fee";

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Học phí & Thanh toán
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem hóa đơn, lịch sử và thanh toán trực tuyến
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Hóa đơn chưa thanh toán */}
      {unpaidFees.length > 0 && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hóa đơn chưa thanh toán ({unpaidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpaidFees.map((record) => {
              const remaining = record.amount - record.paidAmount;
              const statusColor =
                record.status === "PARTIAL"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700";

              return (
                <div
                  key={record.id}
                  className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                        {record.className}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {record.month}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}
                    >
                      {record.status === "PARTIAL"
                        ? "Đã trả một phần"
                        : "Chưa trả"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-5 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng học phí</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(record.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Đã thanh toán</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(record.paidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="font-medium text-gray-900">Còn nợ</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Hạn: {record.dueDate}
                  </div>

                  <button
                    onClick={() =>
                      setSelectedFeeId(
                        selectedFeeId === record.id ? null : record.id,
                      )
                    }
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition"
                  >
                    {selectedFeeId === record.id ? "Đóng" : "Thanh toán QR"}
                  </button>

                  {/* QR Code Display */}
                  {selectedFeeId === record.id && (
                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                      <p className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
                        Quét QR để thanh toán
                      </p>
                      <div className="flex items-center justify-center bg-white rounded-lg p-4 border border-gray-200">
                        {/* Placeholder QR - thay bằng Sepay URL thực tế */}
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-gray-500">
                            QR Code Sepay
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        Quét QR hoặc chuyển khoản {formatCurrency(remaining)}
                      </p>
                      <button
                        onClick={() => {
                          setIsPolling(true);
                        }}
                        className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        ✓ Đã thanh toán
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
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hóa đơn đã thanh toán ({paidFees.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paidFees.map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                      {record.className}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                      {record.month}
                    </h3>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    ✓ Đã trả
                  </span>
                </div>

                <div className="space-y-2 border-t border-green-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng học phí</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(record.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đã thanh toán</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(record.paidAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4">
                  Hạn: {record.dueDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lịch sử thanh toán */}
      {payments.length > 0 && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lịch sử thanh toán
          </h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {payment.method} {payment.note && `• ${payment.note}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trạng thái trống */}
      {!isLoading && fees.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h3 className="text-lg font-semibold text-gray-900">
            Không có hóa đơn
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Bạn đã thanh toán hết học phí hoặc chưa có hóa đơn nào.
          </p>
        </div>
      )}

      {/* Polling status */}
      {isPolling && (
        <div className="fixed bottom-6 right-6 rounded-full bg-blue-500 text-white px-6 py-3 shadow-lg text-sm font-medium animate-pulse">
          Đang kiểm tra... ⏳
        </div>
      )}
    </div>
  );
};

export default StudentFeesPage;
