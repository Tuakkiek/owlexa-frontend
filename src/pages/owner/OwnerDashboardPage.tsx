import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardApi, { type DashboardStats } from "../../api/dashboardApi";
import { useAuthStore } from "../../store/authStore";
import { formatCurrency } from "../../utils/money";
import {
  StatCard,
  Card,
  PageHeader,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";

const quickLinks = [
  {
    title: "Quản lý học sinh",
    to: "/owner/students",
  },
  {
    title: "Quản lý giáo viên",
    to: "/owner/teachers",
  },
  {
    title: "Lớp học",
    to: "/owner/classes",
  },
  {
    title: "Học phí quá hạn",
    to: "/owner/fee-records/overdue",
  },
];

export const OwnerDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStats(await dashboardApi.getOwnerStats());
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

  const paidPercent = stats?.totalFeeRecords
    ? Math.round((stats.paidFeeRecords / stats.totalFeeRecords) * 100)
    : 0;
  const displayName =
    user?.fullName?.split(" ").slice(-1)[0] || user?.fullName || "Owner";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={`Chào ${displayName}`}>
        <Button
          variant="secondary"
          onClick={loadStats}
          isLoading={isLoading}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-card bg-surface-hover"
            />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Học sinh"
              value={stats.totalStudents.toLocaleString("vi-VN")}
            />
            <StatCard
              label="Giáo viên"
              value={stats.totalTeachers.toLocaleString("vi-VN")}
            />
            <StatCard
              label="Lớp học"
              value={stats.totalClasses.toLocaleString("vi-VN")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Tổng doanh thu"
              value={formatCurrency(stats.totalRevenue)}
            />
            <StatCard
              label="Đã thu"
              value={stats.paidFeeRecords.toLocaleString("vi-VN")}
              helper={`${paidPercent}% hóa đơn`}
            />
            <StatCard
              label="Chưa thu"
              value={stats.unpaidFeeRecords.toLocaleString("vi-VN")}
              helper={`${stats.totalFeeRecords} tổng hóa đơn`}
            />
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Tiến độ thu học phí
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {stats.paidFeeRecords} / {stats.totalFeeRecords} hóa đơn đã
                  thanh toán.
                </p>
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {paidPercent}%
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="mt-4 flex gap-4 border-t border-surface-border pt-4 text-sm text-gray-500">
              <span>Đã thu: {stats.paidFeeRecords}</span>
              <span>Chưa thu: {stats.unpaidFeeRecords}</span>
              <span>Tổng số: {stats.totalFeeRecords}</span>
            </div>
            {stats.unpaidFeeRecords > 0 && (
              <div className="mt-4 flex justify-end">
                <Link
                  to="/owner/fee-records/overdue"
                  className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Xem các khoản chưa thu →
                </Link>
              </div>
            )}
          </Card>
        </>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Thao tác nhanh
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-card border border-surface-border bg-white p-6 transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{link.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{link.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboardPage;
