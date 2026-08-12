import { useCallback, useEffect, useState } from "react";
import { PaymentHistoryView } from "../../components/payment/PaymentHistoryView";
import { feeApi, type PaymentFilterParams } from "../../api/feeApi";
import { refundApi } from "../../api/refundApi";
import { usePermissions } from "../../hooks/usePermissions";
import type { PaymentMethod, PaymentPage, PaymentResponse } from "../../types/fee";

const PAGE_SIZE = 15;

interface AppliedPaymentFilters {
  query: string;
  method: string;
  startDate: string;
  endDate: string;
}

const refundMethods: PaymentMethod[] = ["CASH", "BANK_TRANSFER"];

const CashierPaymentHistoryPage = () => {
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedPaymentFilters>({
    query: "",
    method: "",
    startDate: "",
    endDate: "",
  });

  const [refundPayment, setRefundPayment] = useState<PaymentResponse | null>(
    null,
  );
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("CASH");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const { hasPermission, hasAllPermissions } = usePermissions();
  const canProcessRefund =
    hasPermission("PAYMENT_REFUND") ||
    hasAllPermissions(["REFUND_REQUEST", "REFUND_APPROVE", "REFUND_PAY"]);

  const loadPayments = useCallback(
    async (pageNum: number, filters: AppliedPaymentFilters) => {
      try {
        setIsLoading(true);
        setError("");
        const params: PaymentFilterParams = {
          page: pageNum,
          size: PAGE_SIZE,
          sort: "createdAt,desc",
        };
        if (filters.query) params.student = filters.query;
        if (filters.method) params.method = filters.method;
        if (filters.startDate) {
          params.startDate = new Date(filters.startDate).toISOString();
        }
        if (filters.endDate) {
          params.endDate = new Date(filters.endDate).toISOString();
        }

        const result = await feeApi.getPaymentsPaginated("cashier", params);
        setPage(result);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            "Không thể tải lịch sử thanh toán.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPayments(currentPage, appliedFilters);
  }, [appliedFilters, currentPage, loadPayments]);

  const handleSearch = () => {
    setCurrentPage(0);
    setAppliedFilters({
      query,
      method: filterMethod,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
  };

  const handleClearFilters = () => {
    setQuery("");
    setFilterMethod("");
    setFilterStartDate("");
    setFilterEndDate("");
    setCurrentPage(0);
    setAppliedFilters({
      query: "",
      method: "",
      startDate: "",
      endDate: "",
    });
  };

  const openRefundModal = (payment: PaymentResponse) => {
    setRefundPayment(payment);
    setActionError("");
    setRefundAmount("");
    setRefundReason("");
    setRefundMethod("CASH");
  };

  const closeRefundModal = () => {
    if (actionLoading) return;
    setRefundPayment(null);
    setActionError("");
  };

  const handleRefund = async () => {
    if (!refundPayment || !refundAmount || !refundReason.trim()) return;

    try {
      setActionLoading(true);
      setActionError("");
      const refund = await refundApi.requestRefund(
        {
          paymentId: refundPayment.id,
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
      setRefundPayment(null);
      setRefundAmount("");
      setRefundReason("");
      loadPayments(currentPage, appliedFilters);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ?? "Không thể hoàn tiền giao dịch.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PaymentHistoryView
      title="Lịch sử thanh toán"
      description="Tra cứu giao dịch đã thu, xem biên lai và xử lý hoàn tiền khi được cấp quyền."
      page={page}
      isLoading={isLoading}
      error={error}
      query={query}
      filterMethod={filterMethod}
      filterStartDate={filterStartDate}
      filterEndDate={filterEndDate}
      currentPage={currentPage}
      refundPayment={refundPayment}
      refundAmount={refundAmount}
      refundReason={refundReason}
      actionLoading={actionLoading}
      actionError={actionError}
      receiptPath={(paymentId) => `/cashier/payments/${paymentId}/receipt`}
      canRefundPayment={(payment) => canProcessRefund && payment.status === "ACTIVE"}
      onQueryChange={setQuery}
      onFilterMethodChange={setFilterMethod}
      onFilterStartDateChange={setFilterStartDate}
      onFilterEndDateChange={setFilterEndDate}
      onSearch={handleSearch}
      onClearFilters={handleClearFilters}
      onPageChange={setCurrentPage}
      onOpenRefund={openRefundModal}
      onCloseRefund={closeRefundModal}
      onRefundAmountChange={setRefundAmount}
      onRefundReasonChange={setRefundReason}
      onConfirmRefund={handleRefund}
      refundMethod={refundMethod}
      refundMethods={refundMethods}
      onRefundMethodChange={setRefundMethod}
    />
  );
};

export default CashierPaymentHistoryPage;
