import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SearchInput,
  PageHeader,
  ErrorBanner,
  StatCard,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import { feeApi } from "../../api/feeApi";
import type { PaymentResponse } from "../../types/fee";
import { formatMoney, parseMoney } from "../../utils/money";

export const OwnerPaymentsPage = () => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setPayments(await feeApi.getOwnerPayments());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải lịch sử thanh toán.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return payments;
    return payments.filter(
      (p) =>
        p.studentFullName.toLowerCase().includes(keyword) ||
        p.studentPhoneNumber.includes(keyword) ||
        p.classId.toString().includes(keyword),
    );
  }, [payments, query]);

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + parseMoney(p.amount),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Thanh toán">
        <Button
          variant="secondary"
          onClick={loadPayments}
          isLoading={isLoading}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Giao dịch" value={filteredPayments.length} />
        <StatCard label="Tổng tiền" value={formatMoney(String(totalAmount))} />
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Tên, SĐT học sinh hoặc mã lớp..."
      />

      {isLoading ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Đang tải thanh toán...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          Chưa có thanh toán phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Học sinh</th>
                <th className="px-6 py-3">Phương thức</th>
                <th className="px-6 py-3">Ghi chú</th>
                <th className="px-6 py-3 text-right">Số tiền</th>
                <th className="px-6 py-3 text-right">Ngày</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {payment.studentFullName}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {payment.studentPhoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {payment.note || "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatMoney(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {new Date(payment.createdAt).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerPaymentsPage;
