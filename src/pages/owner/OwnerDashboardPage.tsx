import { useEffect, useState, useCallback } from "react";
import dashboardApi, { type DashboardStats } from "../../api/dashboardApi";

const StatCard = ({
  label,
  value,
  color = "gray",
}: {
  label: string;
  value: string | number;
  color?: "gray" | "green" | "red" | "blue";
}) => {
  const colorClasses = {
    gray: "border-gray-200 bg-white",
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
    blue: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border ${colorClasses[color]} p-5`}>
      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
    </div>
  );
};

export const OwnerDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardApi.getOwnerStats();
      setStats(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount ?? 0);

  const paidPct = stats
    ? Math.round((stats.paidFeeRecords / (stats.totalFeeRecords || 1)) * 100)
    : 0;
  const unpaidPct = 100 - paidPct;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Tổng quan trung tâm
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý toàn bộ hoạt động của trung tâm
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Main KPIs */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng học sinh"
            value={stats.totalStudents}
            color="blue"
          />
          <StatCard
            label="Tổng giáo viên"
            value={stats.totalTeachers}
            color="gray"
          />
          <StatCard
            label="Tổng lớp học"
            value={stats.totalClasses}
            color="gray"
          />
          <StatCard
            label="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
            color="green"
          />
        </div>
      ) : null}

      {/* Fee Collection Progress */}
      {!isLoading && stats && (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Tiến độ thu học phí
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {stats.paidFeeRecords} / {stats.totalFeeRecords} hóa đơn đã
                thanh toán
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{paidPct}%</p>
              <p className="text-xs text-gray-500 mt-1">Hoàn thành</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-green-700">
                  ✓ Đã thanh toán
                </span>
                <span className="font-medium text-gray-900">
                  {stats.paidFeeRecords}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-700"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-red-700">
                  ✕ Chưa thanh toán
                </span>
                <span className="font-medium text-gray-900">
                  {stats.unpaidFeeRecords}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 transition-all duration-700"
                  style={{ width: `${unpaidPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2">
        <a
          href="/owner/students"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl">👥</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Quản lý học sinh
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Xem danh sách, thêm/sửa học sinh
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>

        <a
          href="/owner/teachers"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl">🎓</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Quản lý giáo viên
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Xem danh sách, phân công lớp
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>

        <a
          href="/owner/classes"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl">📚</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Quản lý lớp học
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tạo lớp, xem lịch học, điểm danh
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>

        <a
          href="/owner/fees"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl">💰</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Quản lý học phí
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Thu học phí, xem hóa đơn nợ
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>
      </section>

      {/* Fee Details Cards */}
      {!isLoading && stats && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
            <p className="text-sm font-medium text-green-700 uppercase tracking-wide">
              Học phí đã thu
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {stats.paidFeeRecords}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Tổng {formatCurrency(stats.totalRevenue)} thu được
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700 uppercase tracking-wide">
              Học phí chưa thu
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {stats.unpaidFeeRecords}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Cần theo dõi và thu tiếp
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default OwnerDashboardPage;
