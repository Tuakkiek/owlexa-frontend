import { useEffect, useState, useCallback } from "react";
import { feeApi } from "../../api/feeApi";
import { CollectFeeModal } from "../owner/components/CollectFeeModal";
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
      const data = await feeApi.getOverdueFees();
      setFees(data);
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

  const openCollectModal = (record: FeeRecordResponse) => {
    setSelectedFeeRecord(record);
    setIsCollectModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Thu Học Phí</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ghi nhận thanh toán tiền mặt từ học sinh
          </p>
        </div>
        <button
          onClick={loadFees}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Tìm học sinh theo tên hoặc SĐT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))
        ) : filteredFees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
            Không tìm thấy hóa đơn nợ.
          </div>
        ) : (
          filteredFees.map((fee) => {
            const remaining = remainingBalance(fee);
            return (
              <div
                key={fee.id}
                className="rounded-2xl border-2 border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
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

                <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-xs text-gray-500">Tổng</p>
                    <p className="font-semibold text-gray-900">
                      {formatMoney(fee.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Đã trả</p>
                    <p className="font-semibold text-green-600">
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
                  onClick={() => openCollectModal(fee)}
                  className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Ghi nhận thanh toán
                </button>
              </div>
            );
          })
        )}
      </div>
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
