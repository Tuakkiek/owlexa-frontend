import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardApi, { type DashboardStats } from "../../api/dashboardApi";
import { useAuthStore } from "../../store/authStore";

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

const StatCard = ({ label, value, helper }: StatCardProps) => (
  <div className="border p-4 bg-white">
    <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
  </div>
);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount ?? 0);

const quickLinks = [
  {
    title: "Quản lý học sinh",
    description: "Thêm, cập nhật và theo dõi danh sách học sinh.",
    to: "/owner/students",
  },
  {
    title: "Quản lý giáo viên",
    description: "Tạo tài khoản giáo viên và xem danh sách giảng dạy.",
    to: "/owner/teachers",
  },
  {
    title: "Lớp học",
    description: "Thiết lập lớp, trình độ VSTEP và học phí hàng tháng.",
    to: "/owner/classes",
  },
  {
    title: "Học phí quá hạn",
    description: "Theo dõi các khoản chưa thu và ghi nhận thanh toán tiền mặt.",
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
      setError(err?.response?.data?.message ?? "Không thể tải dữ liệu dashboard.");
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

  const displayName = user?.fullName?.split(" ").slice(-1)[0] || user?.fullName || "Owner";

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chào {displayName}</h1>
          <p className="text-xs text-gray-500">Tổng quan hoạt động của trung tâm hôm nay.</p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="border border-black px-3 py-1 text-xs disabled:opacity-50 bg-white"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="border border-red-500 p-2 text-red-600 text-xs">
          Lỗi: {error}
        </div>
      )}

      {/* Content State */}
      {isLoading ? (
        <div className="text-xs text-gray-500">Đang tải dữ liệu tổng quan...</div>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Học sinh" value={stats.totalStudents.toLocaleString("vi-VN")} />
            <StatCard label="Giáo viên" value={stats.totalTeachers.toLocaleString("vi-VN")} />
            <StatCard label="Lớp học" value={stats.totalClasses.toLocaleString("vi-VN")} />
            <StatCard
              label="Học phí đã thu"
              value={stats.paidFeeRecords.toLocaleString("vi-VN")}
              helper={`${paidPercent}% trên tổng số hóa đơn`}
            />
            <StatCard label="Học phí chưa thu" value={stats.unpaidFeeRecords.toLocaleString("vi-VN")} />
            <StatCard label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} />
          </div>

          {/* Progress Section */}
          <section className="border p-4 bg-white">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <div>
                <h2 className="font-bold text-gray-900">Tiến độ thu học phí</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats.paidFeeRecords} / {stats.totalFeeRecords} hóa đơn đã thanh toán.
                </p>
              </div>
              <div className="text-xl font-bold text-gray-900">{paidPercent}%</div>
            </div>
            
            {/* Flat Progress Bar */}
            <div className="h-2 bg-gray-100 border">
              <div className="h-full bg-black" style={{ width: `${paidPercent}%` }} />
            </div>
            
            <div className="mt-3 flex gap-4 text-xs text-gray-500 border-t border-dashed pt-2">
              <span>Đã thu: {stats.paidFeeRecords}</span>
              <span>Chưa thu: {stats.unpaidFeeRecords}</span>
              <span>Tổng số: {stats.totalFeeRecords}</span>
            </div>
          </section>
        </>
      ) : null}

      {/* Quick Links Section */}
      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="border p-4 bg-white block hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900">{link.title}</h3>
            <p className="mt-1 text-xs text-gray-500">{link.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default OwnerDashboardPage;