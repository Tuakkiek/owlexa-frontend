import { useCallback, useEffect, useState } from "react";
import { PaymentHistoryView } from "../../components/payment/PaymentHistoryView";
import { feeApi, type PaymentFilterParams } from "../../api/feeApi";
import { refundApi } from "../../api/refundApi";
import type { PaymentPage, PaymentResponse } from "../../types/fee";

const PAGE_SIZE = 15;

interface AppliedPaymentFilters {
  query: string;
  method: string;
  startDate: string;
  endDate: string;
}

export const OwnerPaymentsPage = () => {
  const [page, setPage] = useState<PaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [refundPayment, setRefundPayment] = useState<PaymentResponse | null>(
    null,
  );
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedPaymentFilters>({
    query: "",
    method: "",
    startDate: "",
    endDate: "",
  });

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

        const result = await feeApi.getPaymentsPaginated("owner", params);
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
      await refundApi.requestRefund({
        paymentId: refundPayment.id,
        amount: refundAmount,
        reason: refundReason.trim(),
      });
      setRefundPayment(null);
      setRefundAmount("");
      setRefundReason("");
      loadPayments(currentPage, appliedFilters);
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? "Không thể hoàn tiền.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PaymentHistoryView
      title="Lịch sử thanh toán"
      description="Theo dõi giao dịch học phí, lọc theo học sinh, phương thức và thời gian."
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
      receiptPath={(paymentId) => `/owner/payments/${paymentId}/receipt`}
      canRefundPayment={(payment) =>
        payment.status !== "VOIDED" && payment.status !== "EXPIRED"
      }
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
    />
  );
};

export default OwnerPaymentsPage;
