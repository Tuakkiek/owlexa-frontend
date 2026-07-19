import { useEffect, useState, useCallback, useMemo } from "react";
import {
  SearchInput,
  PageHeader,
  LoadingSkeleton,
} from "../../components/ui/SharedComponents";
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
      setFeeRecords(await feeApi.getOverdueFees());
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
    await feeApi.collectCash(feeRecordId, data);
    loadOverdueFees();
  };

  const isOwner = user?.roleName === "OWNER";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Quản lý học phí" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Học phí quá hạn</h2>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm học sinh hoặc lớp..."
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} height="h-16" />
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-card border border-surface-border bg-white py-12 text-center text-sm text-gray-400">
          {searchQuery
            ? "Không tìm thấy học phí phù hợp."
            : "Không có học phí quá hạn."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Học sinh</th>
                <th className="px-6 py-3">Lớp</th>
                <th className="px-6 py-3">Tháng</th>
                <th className="px-6 py-3 text-right">Còn nợ</th>
                <th className="px-6 py-3 text-right">Hạn</th>
                {!isOwner && <th className="px-6 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredRecords.map((record) => {
                const remaining = remainingBalance(record);
                return (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {record.studentFullName}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {record.studentPhoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.className}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.month}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-gray-900">
                        {formatMoney(String(remaining))}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        / {formatMoney(record.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {record.dueDate}
                    </td>
                    {!isOwner && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedFeeRecord(record);
                          setIsCollectModalOpen(true);
                        }}
                        className="rounded-btn border border-gray-900 px-3 py-1 text-xs font-medium text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                      >
                        Thu tiền mặt
                      </button>
                    </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export default FeesPage;
