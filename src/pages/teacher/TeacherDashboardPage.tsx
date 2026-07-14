import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { useAuthStore } from "../../store/authStore";
import {
  PageHeader,
  StatCard,
  Card,
  LoadingSkeleton,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { ScheduleResponse } from "../../types/schedule";
import { DAY_LABELS } from "../../types/schedule";

export default function TeacherDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSchedules(await scheduleApi.findMySchedulesAsTeacher());
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu giáo viên.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const grouped = useMemo(
    () =>
      schedules.reduce<Record<number, ScheduleResponse[]>>((acc, item) => {
        if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
        acc[item.dayOfWeek].push(item);
        return acc;
      }, {}),
    [schedules],
  );

  const sortedDays = useMemo(
    () =>
      Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b),
    [grouped],
  );
  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.isActive),
    [schedules],
  );
  const classCount = useMemo(
    () => new Set(schedules.map((s) => s.classId)).size,
    [schedules],
  );

  const todaySchedules = useMemo(() => {
    const today = new Date().getDay();
    return schedules
      .filter((s) => s.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={`Chào, ${user?.fullName ?? "giáo viên"}`}>
        <Button
          variant="secondary"
          onClick={loadData}
          isLoading={isLoading}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng lịch dạy"
          value={isLoading ? "..." : schedules.length}
        />
        <StatCard
          label="Buổi đang hoạt động"
          value={isLoading ? "..." : activeSchedules.length}
        />
        <StatCard
          label="Số lớp phụ trách"
          value={isLoading ? "..." : classCount}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lịch dạy tuần này
          </h2>
          {isLoading ? (
            <LoadingSkeleton count={4} height="h-20" />
          ) : schedules.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
              Chưa có lịch dạy nào được gán.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDays.map((day) => (
                <div key={day}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {DAY_LABELS[day]}
                  </h3>
                  <div className="space-y-2">
                    {grouped[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between rounded-btn border border-surface-border bg-surface-hover px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {schedule.className}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Phòng {schedule.room} · #{schedule.classId}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold text-gray-900">
                              {schedule.startTime.slice(0, 5)} -{" "}
                              {schedule.endTime.slice(0, 5)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {schedule.isActive ? "Đang mở" : "Tạm dừng"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Hôm nay</h2>
          <p className="mt-1 text-sm text-gray-500">
            {todaySchedules.length > 0
              ? `Bạn có ${todaySchedules.length} buổi dạy hôm nay.`
              : "Hôm nay chưa có buổi dạy nào."}
          </p>
          <div className="mt-4 space-y-2">
            {todaySchedules.length === 0 ? (
              <div className="rounded-btn border border-dashed border-surface-border bg-surface-page p-4 text-sm text-gray-500">
                Nghỉ ngơi một chút, hoặc chuẩn bị trước cho buổi học kế tiếp.
              </div>
            ) : (
              todaySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-btn border border-surface-border bg-surface-hover px-4 py-3"
                >
                  <p className="font-semibold text-gray-900">
                    {schedule.className}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {schedule.startTime.slice(0, 5)} -{" "}
                    {schedule.endTime.slice(0, 5)} · Phòng {schedule.room}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
