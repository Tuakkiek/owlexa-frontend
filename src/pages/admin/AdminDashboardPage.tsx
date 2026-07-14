import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import {
  PageHeader,
  StatCard,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
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
      setError(err?.response?.data?.message ?? "Không thể tải thống kê.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Tổng quan hệ thống">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-card bg-surface-hover"
              />
            ))
          : statCards.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={stats?.[card.key] ?? 0}
              />
            ))}
      </div>
    </div>
  );
}
