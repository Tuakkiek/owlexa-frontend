import { useEffect, useState, useCallback } from "react";
import { feeApi } from "../../api/feeApi";
import { CollectFeeModal } from "../owner/components/CollectFeeModal";
import {
  PageHeader,
  SearchInput,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { FeeRecordResponse, CashPaymentRequest } from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

const CashierPaymentsPage = () => {
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeRecord, setSelectedFeeRecord] =
    useState<FeeRecordResponse | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  const loadFees = useCallback(async () => {
    try {
      setIsLoading(true);
      setFees(await feeApi.getOverdueFees("CASHIER"));
    } catch (error) {
      console.error("Failed to load fees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const filteredFees = fees.filter(
    (f) =>
      f.studentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.studentPhoneNumber.includes(searchQuery),
  );

  const handleCollectCash = async (
    feeRecordId: number,
    data: CashPaymentRequest,
  ) => {
    await feeApi.collectCash(feeRecordId, data, "CASHIER");
    loadFees();
  };

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
        onChange={setSearchQuery}
        placeholder="Tìm học sinh theo tên hoặc SĐT..."
      />

      {isLoading ? (
        <LoadingSkeleton count={5} height="h-20" />
      ) : filteredFees.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
          Không tìm thấy hóa đơn nợ.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFees.map((fee) => {
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
                    setIsCollectModalOpen(true);
                  }}
                  className="mt-4 w-full rounded-btn border border-surface-border bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-surface-hover"
                >
                  Ghi nhận thanh toán
                </button>
              </div>
            );
          })}
        </div>
      )}

      <CollectFeeModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        feeRecord={selectedFeeRecord}
        onSubmit={handleCollectCash}
      />
    </div>
  );
};

export default CashierPaymentsPage;
