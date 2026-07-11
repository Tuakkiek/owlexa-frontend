import { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "../../components/ui/Input";
import { CollectFeeModal } from "./components/CollectFeeModal";
import { useAuthStore } from "../../store/authStore";
import { feeApi } from "../../api/feeApi";
import type { FeeRecordResponse, CashPaymentRequest } from "../../types/fee";
import { formatMoney, remainingBalance } from "../../utils/money";

export const FeesPage = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFeeRecord, setSelectedFeeRecord] =
    useState<FeeRecordResponse | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadOverdueFees = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await feeApi.getOverdueFees();
      setFeeRecords(data);
    } catch (error) {
      console.error("Failed to load overdue fees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverdueFees();
  }, [loadOverdueFees]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return feeRecords;
    const lowerQ = searchQuery.toLowerCase();
    return feeRecords.filter(
      (r) =>
        r.studentFullName.toLowerCase().includes(lowerQ) ||
        r.studentPhoneNumber.includes(lowerQ) ||
        r.className.toLowerCase().includes(lowerQ),
    );
  }, [feeRecords, searchQuery]);

  const handleCollectCash = async (
    feeRecordId: number,
    data: CashPaymentRequest,
  ) => {
    await feeApi.collectCash(feeRecordId, data, user?.roleName);
    loadOverdueFees();
  };

  const openCollectModal = (record: FeeRecordResponse) => {
    setSelectedFeeRecord(record);
    setIsCollectModalOpen(true);
  };

  return (
    <div className="space-y-6 text-neutral-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header tinh giản, sử dụng border mảnh phía dưới */}
      <div className="py-4 border-b border-neutral-200">
        <h1 className="text-xl font-medium tracking-tight">
          Fee & Revenue Management
        </h1>
      </div>

      {/* Thanh công cụ phẳng: Đưa tiêu đề phụ và ô tìm kiếm về dạng tối giản, không đổ bóng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <h2 className="text-base font-medium text-neutral-800">Overdue Fees</h2>
        <div className="w-full sm:w-72">
          <Input
            label=""
            placeholder="Search student or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Khu vực bảng dữ liệu phẳng (Flat UI) */}
      <div className="w-full overflow-x-auto pt-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-neutral-400">
            Loading fee records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">
            {searchQuery
              ? "No matching fee records found."
              : "Great! There are no overdue fees."}
          </div>
        ) : (
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400">
                <th className="pb-3 pr-4 font-normal">Student</th>
                <th className="pb-3 px-4 font-normal">Class</th>
                <th className="pb-3 px-4 font-normal">Month</th>
                <th className="pb-3 px-4 font-normal text-right">
                  Remaining Balance
                </th>
                <th className="pb-3 px-4 font-normal text-right">Due Date</th>
                <th className="pb-3 pl-4 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRecords.map((record) => {
                const remaining = remainingBalance(record);
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="py-4 pr-4">
                      <div className="font-normal text-neutral-900">
                        {record.studentFullName}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {record.studentPhoneNumber}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-neutral-600">
                      {record.className}
                    </td>
                    <td className="py-4 px-4 text-neutral-500">
                      {record.month}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-medium text-neutral-900">
                        {formatMoney(String(remaining))}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        of {formatMoney(record.amount)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-neutral-600">
                      {record.dueDate}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        onClick={() => openCollectModal(record)}
                        className="border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white px-3 py-1 text-xs transition-colors font-medium"
                      >
                        Collect Cash
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export default FeesPage;
