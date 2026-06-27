import { useEffect, useState, useCallback } from "react";
import dashboardApi, { type DashboardStats } from "../../api/dashboardApi";

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="border border-gray-300 rounded p-5">
    <p className="text-sm text-gray-600">
      {label}
    </p>

    <p className="mt-2 text-3xl font-bold">
      {value}
    </p>
  </div>
);

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
        err?.response?.data?.message ??
          "Không thể tải dữ liệu dashboard."
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
    ? Math.round(
        (stats.paidFeeRecords / (stats.totalFeeRecords || 1)) * 100
      )
    : 0;

  const unpaidPct = 100 - paidPct;

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Tổng quan trung tâm
          </h1>

          <p className="text-sm text-gray-600">
            Quản lý toàn bộ hoạt động của trung tâm
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="border border-gray-300 rounded p-4 text-sm bg-gray-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 border border-gray-300 rounded bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng học sinh"
            value={stats.totalStudents}
          />

          <StatCard
            label="Tổng giáo viên"
            value={stats.totalTeachers}
          />

          <StatCard
            label="Tổng lớp học"
            value={stats.totalClasses}
          />

          <StatCard
            label="Tổng doanh thu"
            value={formatCurrency(stats.totalRevenue)}
          />
        </div>
      ) : null}

      {!isLoading && stats && (
        <section className="border border-gray-300 rounded p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-semibold">
                Tiến độ thu học phí
              </h2>

              <p className="text-sm text-gray-600">
                {stats.paidFeeRecords} / {stats.totalFeeRecords} hóa đơn đã thanh toán
              </p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-bold">
                {paidPct}%
              </p>

              <p className="text-sm text-gray-600">
                Hoàn thành
              </p>
            </div>

          </div>

          <div className="space-y-5">

            <div>

              <div className="flex justify-between text-sm mb-2">
                <span>Đã thanh toán</span>
                <span>{stats.paidFeeRecords}</span>
              </div>

              <div className="w-full h-3 border border-gray-300 rounded overflow-hidden">
                <div
                  className="h-full bg-gray-700"
                  style={{ width: `${paidPct}%` }}
                />
              </div>

            </div>

            <div>

              <div className="flex justify-between text-sm mb-2">
                <span>Chưa thanh toán</span>
                <span>{stats.unpaidFeeRecords}</span>
              </div>

              <div className="w-full h-3 border border-gray-300 rounded overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{ width: `${unpaidPct}%` }}
                />
              </div>

            </div>

          </div>

        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">

        <a
          href="/owner/students"
          className="border border-gray-300 rounded p-6 hover:bg-gray-100"
        >
          <h3 className="font-semibold">
            Quản lý học sinh
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Xem danh sách, thêm và chỉnh sửa học sinh.
          </p>
        </a>

        <a
          href="/owner/teachers"
          className="border border-gray-300 rounded p-6 hover:bg-gray-100"
        >
          <h3 className="font-semibold">
            Quản lý giáo viên
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Xem danh sách và phân công lớp.
          </p>
        </a>

        <a
          href="/owner/classes"
          className="border border-gray-300 rounded p-6 hover:bg-gray-100"
        >
          <h3 className="font-semibold">
            Quản lý lớp học
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Tạo lớp, xem lịch học và điểm danh.
          </p>
        </a>

        <a
          href="/owner/fees"
          className="border border-gray-300 rounded p-6 hover:bg-gray-100"
        >
          <h3 className="font-semibold">
            Quản lý học phí
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Thu học phí và theo dõi các hóa đơn.
          </p>
        </a>

      </section>

      {!isLoading && stats && (

        <section className="grid gap-4 md:grid-cols-2">

          <div className="border border-gray-300 rounded p-6">

            <p className="text-sm text-gray-600">
              Học phí đã thu
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats.paidFeeRecords}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {formatCurrency(stats.totalRevenue)}
            </p>

          </div>

          <div className="border border-gray-300 rounded p-6">

            <p className="text-sm text-gray-600">
              Học phí chưa thu
            </p>

            <p className="mt-2 text-3xl font-bold">
              {stats.unpaidFeeRecords}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Cần tiếp tục theo dõi và thu học phí.
            </p>

          </div>

        </section>

      )}

    </div>
  );
};

export default OwnerDashboardPage;