import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { feeApi, type PaymentFilterParams } from "../../api/feeApi";
import { refundApi } from "../../api/refundApi";
import { usePermissions } from "../../hooks/usePermissions";
import type { PaymentHistoryPage, PaymentHistoryResponse, PaymentMethod } from "../../types/fee";
import { PageHeader, ErrorBanner } from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import { PaymentSummaryCards } from "../owner/components/payments/PaymentSummaryCards";
import { PaymentStatusTabs } from "../owner/components/payments/PaymentStatusTabs";
import { PaymentFilterToolbar } from "../owner/components/payments/PaymentFilterToolbar";
import { PaymentTable } from "../owner/components/payments/PaymentTable";
import { PaymentDetailDrawer } from "../owner/components/payments/PaymentDetailDrawer";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;
const refundMethods: PaymentMethod[] = ["CASH", "BANK_TRANSFER"];

export const CashierPaymentHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const query = searchParams.get("query") || "";
  const method = searchParams.get("method") || "";
  const status = searchParams.get("status") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const currentPage = parseInt(searchParams.get("page") || "0", 10);

  // Data state
  const [page, setPage] = useState<PaymentHistoryPage | null>(null);
  const [summary, setSummary] = useState({ totalTransactions: 0, totalRevenue: 0, pendingCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer state
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryResponse | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("CASH");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const { hasPermission } = usePermissions();
  const canProcessRefund = hasPermission("CASHIER_PAYMENT_HISTORY");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const params: PaymentFilterParams = {
        page: currentPage,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
      };
      if (query) params.student = query;
      if (method) params.method = method;
      if (status) params.status = status;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const [pageResult, summaryResult] = await Promise.all([
        feeApi.getPaymentHistoryPaginated("cashier", params),
        feeApi.getPaymentHistorySummary("cashier", params),
      ]);

      setPage(pageResult);
      setSummary(summaryResult);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lịch sử thanh toán.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, query, method, status, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for updating URL state
  const updateParams = (newParams: Record<string, string>) => {
    const current = Object.fromEntries(searchParams.entries());
    const updated = { ...current, ...newParams };

    // Reset page to 0 if filters change (other than page itself)
    if (Object.keys(newParams).some((k) => k !== "page")) {
      updated.page = "0";
    }

    // Remove empty params
    Object.keys(updated).forEach((k) => {
      if (!updated[k]) delete updated[k];
    });

    setSearchParams(updated);
  };

  const handleRefund = async () => {
    if (!selectedPayment?.paymentId || !refundAmount || !refundReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError("");
      const refund = await refundApi.requestRefund(
        {
          paymentId: selectedPayment.paymentId,
          amount: refundAmount,
          reason: refundReason.trim(),
        },
        "cashier",
      );
      const approvedRefund = await refundApi.decideRefund(
        refund.id,
        { approve: true },
        "cashier",
      );
      await refundApi.payoutRefund(
        approvedRefund.id,
        { refundMethod },
        "cashier",
      );

      // Reset refund form & selected payment
      setRefundAmount("");
      setRefundReason("");
      setRefundMethod("CASH");
      setSelectedPayment(null);
      // Reload
      loadData();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? "Không thể hoàn tiền giao dịch.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(page?.totalPages ?? 0, 1);
  const canRefundPayment = (p: PaymentHistoryResponse) =>
    canProcessRefund && p.source === "PAYMENT" && p.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Lịch sử thanh toán"
        description="Tra cứu giao dịch đã thu, xem biên lai và xử lý hoàn tiền khi được cấp quyền."
      />

      {error && <ErrorBanner message={error} />}

      <PaymentSummaryCards
        totalTransactions={summary.totalTransactions}
        totalRevenue={summary.totalRevenue}
        pendingCount={summary.pendingCount}
        isLoading={isLoading}
      />

      <div className="space-y-4">
        <PaymentStatusTabs
          activeStatus={status}
          onChange={(newStatus) => updateParams({ status: newStatus })}
        />

        <PaymentFilterToolbar
          query={query}
          method={method}
          startDate={startDate}
          endDate={endDate}
          onQueryChange={(q) => updateParams({ query: q })}
          onMethodChange={(m) => updateParams({ method: m })}
          onDateRangeChange={(start, end) => updateParams({ startDate: start, endDate: end })}
        />

        <PaymentTable
          payments={page?.content || []}
          isLoading={isLoading}
          onRowClick={setSelectedPayment}
        />

        {/* Pagination */}
        {page && page.content.length > 0 && (
          <div className="flex items-center justify-between border-t border-surface-border pt-4">
            <span className="text-sm text-gray-500">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => updateParams({ page: (currentPage - 1).toString() })}
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => updateParams({ page: (currentPage + 1).toString() })}
              >
                Sau <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PaymentDetailDrawer
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => {
          setSelectedPayment(null);
          setActionError("");
          setRefundAmount("");
          setRefundReason("");
          setRefundMethod("CASH");
        }}
        refundAmount={refundAmount}
        refundReason={refundReason}
        refundMethod={refundMethod}
        refundMethods={refundMethods}
        onRefundMethodChange={setRefundMethod}
        actionLoading={actionLoading}
        actionError={actionError}
        onRefundAmountChange={setRefundAmount}
        onRefundReasonChange={setRefundReason}
        onConfirmRefund={handleRefund}
        canRefundPayment={canRefundPayment}
        receiptPath={(id) => `/cashier/payments/${id}/receipt`}
      />
    </div>
  );
};

export default CashierPaymentHistoryPage;
