import { useCallback, useEffect, useState } from "react";
import {
  SearchInput,
  PageHeader,
  ErrorBanner,
  Badge,
  EmptyState,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import { feeApi, type PaymentFilterParams } from "../../api/feeApi";
import type { PaymentPage, PaymentResponse } from "../../types/fee";
import { formatMoney } from "../../utils/money";
import {
  FEE_STATUS_COLORS,
  FEE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../types/fee";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const PAGE_SIZE = 15;

export const OwnerPaymentsPage = () => {
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [showVoidModal, setShowVoidModal] = useState<PaymentResponse | null>(
    null,
  );
  const [showRefundModal, setShowRefundModal] =
    useState<PaymentResponse | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const loadPayments = useCallback(
    async (pageNum: number, searchQuery: string) => {
      try {
        setIsLoading(true);
        setError("");
        const params: PaymentFilterParams = {
          page: pageNum,
          size: PAGE_SIZE,
          sort: "createdAt,desc",
        };
        if (searchQuery) params.student = searchQuery;
        if (filterMethod) params.method = filterMethod;
        if (filterStartDate)
          params.startDate = new Date(filterStartDate).toISOString();
        if (filterEndDate)
          params.endDate = new Date(filterEndDate).toISOString();
        const result = await feeApi.getPaymentsPaginated("owner", params);
        setPage(result);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Không thể tải lịch sử thanh toán.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPayments(currentPage, query);
  }, [currentPage, loadPayments]);

  const handleSearch = () => {
    setCurrentPage(0);
    loadPayments(0, query);
  };

  const handleVoid = async () => {
    if (!showVoidModal || !voidReason.trim()) return;
    try {
      setActionLoading(true);
      setActionError("");
      await axiosClient.post(
        `/owner/payments/${showVoidModal.id}/void?reason=${encodeURIComponent(voidReason)}`,
      );
      setShowVoidModal(null);
      setVoidReason("");
      loadPayments(currentPage, query);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ?? "Không thể void giao dịch.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!showRefundModal || !refundAmount) return;
    try {
      setActionLoading(true);
      setActionError("");
      await axiosClient.post(
        `/owner/payments/${showRefundModal.id}/refund`,
        null,
        {
          params: { amount: refundAmount, reason: refundReason || undefined },
        },
      );
      setShowRefundModal(null);
      setRefundAmount("");
      setRefundReason("");
      loadPayments(currentPage, query);
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? "Không thể hoàn tiền.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Lịch sử thanh toán" />

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Tên hoặc SĐT học sinh..."
        />
        <Button onClick={handleSearch} variant="secondary" size="sm">
          Tìm
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="rounded-input border border-gray-300 p-2 text-sm"
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
        >
          <option value="">Tất cả phương thức</option>
          <option value="CASH">Tiền mặt</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="QR_CODE">QR Code</option>
          <option value="ONLINE">Online</option>
          <option value="SEPAY">SePay</option>
        </select>
        <input
          type="date"
          className="rounded-input border border-gray-300 p-2 text-sm"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          placeholder="Từ ngày"
        />
        <input
          type="date"
          className="rounded-input border border-gray-300 p-2 text-sm"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          placeholder="Đến ngày"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-card bg-surface-hover"
            />
          ))}
        </div>
      ) : !page || page.content.length === 0 ? (
        <EmptyState message="Chưa có thanh toán nào." icon="📋" />
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-surface-border bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Mã biên lai</th>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Lớp / Khóa</th>
                  <th className="px-4 py-3">Phương thức</th>
                  <th className="px-4 py-3">Người thu</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Ngày</th>
                  <th className="px-4 py-3 text-center">TT</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {page.content.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {payment.receiptNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {payment.studentFullName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.studentPhoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{payment.className}</div>
                      {payment.courseName && (
                        <div className="text-xs text-gray-400">
                          {payment.courseName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">
                        {PAYMENT_METHOD_LABELS[payment.method] ??
                          payment.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {payment.collectedByUserName || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STATUS_COLORS[payment.feeRecordStatus]}`}
                      >
                        {FEE_STATUS_LABELS[payment.feeRecordStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                      <br />
                      {new Date(payment.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/owner/payments/${payment.id}/receipt`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          BL
                        </Link>
                        {payment.status !== "VOIDED" &&
                          payment.status !== "EXPIRED" && (
                            <>
                              <button
                                onClick={() => {
                                  setShowRefundModal(payment);
                                  setActionError("");
                                  setRefundAmount("");
                                  setRefundReason("");
                                }}
                                className="text-xs font-medium text-amber-600 hover:underline"
                              >
                                Hoàn
                              </button>
                              <button
                                onClick={() => {
                                  setShowVoidModal(payment);
                                  setActionError("");
                                  setVoidReason("");
                                }}
                                className="text-xs font-medium text-red-600 hover:underline"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Tổng: {page.totalElements} giao dịch | Trang {page.number + 1}/
              {page.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= page.totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowVoidModal(null)}
        >
          <div
            className="w-full max-w-md rounded-card bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Hủy giao dịch
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Biên lai: {showVoidModal.receiptNumber} —{" "}
              {formatMoney(showVoidModal.amount)}
            </p>
            {actionError && (
              <p className="mt-2 text-sm text-red-600">{actionError}</p>
            )}
            <textarea
              className="mt-3 w-full rounded-input border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Lý do hủy (bắt buộc)"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowVoidModal(null)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={handleVoid}
                isLoading={actionLoading}
                disabled={!voidReason.trim()}
              >
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowRefundModal(null)}
        >
          <div
            className="w-full max-w-md rounded-card bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">Hoàn tiền</h3>
            <p className="mt-2 text-sm text-gray-500">
              Biên lai: {showRefundModal.receiptNumber} — Đã thu:{" "}
              {formatMoney(showRefundModal.amount)}
            </p>
            {actionError && (
              <p className="mt-2 text-sm text-red-600">{actionError}</p>
            )}
            <input
              type="number"
              className="mt-3 w-full rounded-input border border-gray-300 p-2 text-sm"
              placeholder="Số tiền hoàn"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
            <textarea
              className="mt-2 w-full rounded-input border border-gray-300 p-2 text-sm"
              rows={2}
              placeholder="Lý do (tùy chọn)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRefundModal(null)}
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={handleRefund}
                isLoading={actionLoading}
                disabled={!refundAmount || Number(refundAmount) <= 0}
              >
                Xác nhận hoàn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPaymentsPage;
