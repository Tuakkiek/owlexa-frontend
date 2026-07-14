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
    <div className="space-y-6 text-gray-900 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header tinh giản, sử dụng border mảnh phía dưới */}
      <div className="py-4 border-b border-gray-200">
        <h1 className="text-xl font-medium tracking-tight">
          Quản lý học phí
        </h1>
      </div>

      {/* Thanh công cụ phẳng: Đưa tiêu đề phụ và ô tìm kiếm về dạng tối giản, không đổ bóng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <h2 className="text-base font-medium text-gray-800">Học phí quá hạn</h2>
        <div className="w-full sm:w-72">
          <Input
            label=""
            placeholder="Tìm học sinh hoặc lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Khu vực bảng dữ liệu phẳng (Flat UI) */}
      <div className="w-full overflow-x-auto pt-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Đang tải học phí...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {searchQuery
              ? "Không tìm thấy học phí phù hợp."
              : "Không có học phí quá hạn."}
          </div>
        ) : (
          <table className="min-w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400">
                <th className="pb-3 pr-4 font-normal">Học sinh</th>
                <th className="pb-3 px-4 font-normal">Lớp</th>
                <th className="pb-3 px-4 font-normal">Tháng</th>
                <th className="pb-3 px-4 font-normal text-right">
                  Còn nợ
                </th>
                <th className="pb-3 px-4 font-normal text-right">Hạn</th>
                <th className="pb-3 pl-4 text-right font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => {
                const remaining = remainingBalance(record);
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 pr-4">
                      <div className="font-normal text-gray-900">
                        {record.studentFullName}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {record.studentPhoneNumber}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {record.className}
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      {record.month}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-medium text-gray-900">
                        {formatMoney(String(remaining))}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        / {formatMoney(record.amount)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600">
                      {record.dueDate}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        onClick={() => openCollectModal(record)}
                        className="border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-3 py-1 text-xs transition-colors font-medium"
                      >
                        Thu tiền mặt
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
