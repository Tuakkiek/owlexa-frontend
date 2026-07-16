import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import {
  PageHeader,
  StatCard,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { ScheduleResponse } from "../../types/schedule";
import { DAY_LABELS } from "../../types/schedule";

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSchedules(await scheduleApi.findMySchedulesAsTeacher());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lịch dạy.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
  const totalClasses = useMemo(
    () => new Set(schedules.map((s) => s.classId)).size,
    [schedules],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Lịch dạy của tôi">
        <Button
          variant="secondary"
          onClick={load}
          isLoading={isLoading}
          size="sm"
        >
          Làm mới
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng buổi học"
          value={isLoading ? "..." : schedules.length}
        />
        <StatCard
          label="Lớp phụ trách"
          value={isLoading ? "..." : totalClasses}
        />
        <StatCard
          label="Buổi đang hoạt động"
          value={isLoading ? "..." : schedules.filter((s) => s.isActive).length}
        />
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-card bg-surface-hover"
            />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
          Chưa có lịch dạy nào.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {DAY_LABELS[day]}
              </h2>
              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-4 rounded-card border border-surface-border bg-white p-4"
                    >
                      <div className="min-w-[72px] text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {schedule.startTime.slice(0, 5)}
                        </div>
                        <div className="text-xs text-gray-400">-</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {schedule.endTime.slice(0, 5)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">
                          {schedule.className}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Phòng {schedule.roomName} · #{schedule.classId}
                        </div>
                      </div>
                      {!schedule.isActive && (
                        <span className="shrink-0 rounded-full border border-surface-border px-3 py-1 text-xs font-medium text-gray-500">
                          Tạm dừng
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
