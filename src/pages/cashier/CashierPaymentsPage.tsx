import { useEffect, useState, useCallback } from "react";
import { feeApi } from "../../api/feeApi";
import { PaymentDialog } from "../../components/payment/PaymentDialog";
import {
  PageHeader,
  SearchInput,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { FeeRecordResponse } from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

const CashierPaymentsPage = () => {
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFeeRecord, setSelectedFeeRecord] =
    useState<FeeRecordResponse | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const loadFees = useCallback(async () => {
    try {
      setIsLoading(true);
      setFees(await feeApi.getPendingFees("CASHIER"));
    } catch (error) {
      console.error("Failed to load fees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const normalizedQuery = trimmedQuery.replace(/\s+/g, " ");
  const queryPhone = normalizedQuery.replace(/\D/g, "");

  const filteredFees = fees.filter((f) => {
    if (!normalizedQuery) return true;

    const fullName = (f.studentFullName || "").toLowerCase().replace(/\s+/g, " ");
    const className = (f.className || "").toLowerCase().replace(/\s+/g, " ");
    const month = (f.month || "").toLowerCase();
    const phone = (f.studentPhoneNumber || "").replace(/\D/g, "");

    const nameOrClassOrMonthMatch =
      fullName.includes(normalizedQuery) ||
      className.includes(normalizedQuery) ||
      month.includes(normalizedQuery);

    const phoneMatch = queryPhone.length > 0 && phone.includes(queryPhone);

    return nameOrClassOrMonthMatch || phoneMatch;
  });

  const totalPages = Math.ceil(filteredFees.length / PAGE_SIZE) || 1;
  const paginatedFees = filteredFees.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const handlePaymentComplete = useCallback(() => {
    loadFees();
  }, [loadFees]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Thu Học Phí">
        <Button
          variant="secondary"
          onClick={loadFees}
          isLoading={isLoading}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Tìm học sinh theo tên hoặc SĐT..."
      />

      {isLoading ? (
        <LoadingSkeleton count={5} height="h-20" />
      ) : filteredFees.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
          Không tìm thấy hóa đơn nợ.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedFees.map((fee) => {
              const remaining = remainingBalance(fee);
              return (
                <div
                  key={fee.id}
                  className="rounded-card border border-surface-border bg-white p-6"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {fee.studentFullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {fee.studentPhoneNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {fee.className}
                      </p>
                      <p className="text-sm text-gray-500">{fee.month}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-surface-border pt-4">
                    <div>
                      <p className="text-xs text-gray-500">Tổng</p>
                      <p className="font-semibold text-gray-900">
                        {formatMoney(fee.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Đã trả</p>
                      <p className="font-semibold text-emerald-600">
                        {formatMoney(fee.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Còn nợ</p>
                      <p className="font-semibold text-red-600">
                        {formatMoney(String(remaining))}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFeeRecord(fee);
                      setIsPaymentDialogOpen(true);
                    }}
                    className="mt-4 w-full rounded-btn border border-surface-border bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-surface-hover"
                  >
                    Ghi nhận thanh toán
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredFees.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-surface-border pt-4 text-sm text-gray-500">
              <span>
                Hiển thị {currentPage * PAGE_SIZE + 1} -{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, filteredFees.length)}{" "}
                trên {filteredFees.length} hóa đơn nợ
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 mr-2">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                >
                  Sau <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        feeRecord={selectedFeeRecord}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default CashierPaymentsPage;
