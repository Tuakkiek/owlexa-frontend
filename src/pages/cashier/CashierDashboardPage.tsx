import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { formatCurrency } from "../../utils/money";
import {
  StatCard,
  Card,
  PageHeader,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import axiosClient from "../../api/axiosClient";

interface CashierDashboardStats {
  totalPaymentsToday: number;
  totalAmountCollectedToday: number;
  totalPendingPayments: number;
  totalPendingAmount: number;
  totalPaymentsThisMonth: number;
}

const quickLinks = [
  { title: "Thu học phí", to: "/cashier/payments" },
  { title: "Lịch sử thanh toán", to: "/cashier/payment-history" },
];

const CashierDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<CashierDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosClient.get<CashierDashboardStats>(
        "/cashier/dashboard/stats",
      );
      setStats(response.data);
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Chào mừng, ${user?.fullName ?? "Thu ngân"}`}
        subtitle="Tổng quan hoạt động thu ngân"
      >
        <Button variant="secondary" onClick={loadStats} isLoading={isLoading}>
          Làm mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-16" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Thanh toán hôm nay"
            value={stats?.totalPaymentsToday ?? 0}
          />
          <StatCard
            label="Tiền thu hôm nay"
            value={formatCurrency(stats?.totalAmountCollectedToday ?? 0)}
          />
          <StatCard
            label="Khoản chờ thu"
            value={stats?.totalPendingPayments ?? 0}
          />
          <StatCard
            label="Tiền chưa thu"
            value={formatCurrency(stats?.totalPendingAmount ?? 0)}
          />
        </div>
      )}

      {/* Quick links */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-btn border border-surface-border bg-surface-page px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CashierDashboardPage;
