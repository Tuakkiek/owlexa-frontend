import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../../components/ui/Input";
import { feeApi } from "../../api/feeApi";
import type { PaymentResponse } from "../../types/fee";
import { formatMoney, parseMoney } from "../../utils/money";

const CashierPaymentHistoryPage = () => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setPayments(await feeApi.getCashierPayments());
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
      (payment) =>
        payment.studentFullName.toLowerCase().includes(keyword) ||
        payment.studentPhoneNumber.includes(keyword),
    );
  }, [payments, query]);

  const totalAmount = filteredPayments.reduce(
    (sum, payment) => sum + parseMoney(payment.amount),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Lịch sử thanh toán
          </h1>
        </div>
        <button
          onClick={loadPayments}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Giao dịch</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {filteredPayments.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
          <p className="text-sm text-gray-500">Tổng tiền đã thu</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatMoney(String(totalAmount))}
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Input
          label="Tìm kiếm"
          placeholder="Tên hoặc SĐT học sinh"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Đang tải...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Chưa có thanh toán phù hợp.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Học sinh</th>
                <th className="px-5 py-3 font-medium">Phương thức</th>
                <th className="px-5 py-3 font-medium">Ghi chú</th>
                <th className="px-5 py-3 text-right font-medium">Số tiền</th>
                <th className="px-5 py-3 text-right font-medium">
                  Ngày ghi nhận
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {payment.studentFullName}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {payment.studentPhoneNumber}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{payment.method}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {payment.note || "-"}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">
                    {formatMoney(payment.amount)}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">
                    {new Date(payment.createdAt).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CashierPaymentHistoryPage;
