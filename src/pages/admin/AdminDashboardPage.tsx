import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import type { AdminStats } from "../../types/admin";

const statCards: Array<{ key: keyof AdminStats; label: string }> = [
  { key: "totalUsers", label: "Tổng người dùng" },
  { key: "totalCenters", label: "Trung tâm" },
  { key: "totalOwners", label: "Owner" },
  { key: "totalTeachers", label: "Giáo viên" },
  { key: "totalStudents", label: "Học sinh" },
  { key: "totalCashiers", label: "Thu ngân" },
  { key: "totalAdmins", label: "Admin" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setStats(await adminApi.getStats());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải thống kê hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi số lượng tài khoản và trung tâm trên toàn hệ thống.
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            ))
          : statCards.map((card) => (
              <div key={card.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-gray-900">
                  {stats?.[card.key] ?? 0}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
