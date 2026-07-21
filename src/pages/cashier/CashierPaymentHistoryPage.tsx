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
import type { PaymentPage } from "../../types/fee";
import { formatMoney } from "../../utils/money";
import {
  FEE_STATUS_COLORS,
  FEE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "../../types/fee";
import { Link } from "react-router-dom";

const PAGE_SIZE = 15;

const CashierPaymentHistoryPage = () => {
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

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
        const result = await feeApi.getPaymentsPaginated("cashier", params);
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
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-center">TT</th>
                  <th className="px-4 py-3 text-right">Ngày</th>
                  <th className="px-4 py-3 text-right">BL</th>
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
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
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
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/cashier/payments/${payment.id}/receipt`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Xem
                      </Link>
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
    </div>
  );
};

export default CashierPaymentHistoryPage;
