import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import type { ScheduleResponse } from "../../types/schedule";
import { DAY_LABELS } from "../../types/schedule";

const SkeletonRow = () => (
  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
    <div className="h-12 w-16 rounded-lg bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-1/3 rounded bg-gray-200" />
      <div className="h-3 w-1/4 rounded bg-gray-200" />
    </div>
    <div className="h-3 w-20 rounded bg-gray-200" />
  </div>
);

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await scheduleApi.findMySchedulesAsTeacher();
      setSchedules(data);
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
        if (!acc[item.dayOfWeek]) {
          acc[item.dayOfWeek] = [];
        }
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
    () => new Set(schedules.map((schedule) => schedule.classId)).size,
    [schedules],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Lịch dạy của tôi
          </h1>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tổng buổi học
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading ? "..." : schedules.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Lớp phụ trách
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading ? "..." : totalClasses}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Buổi đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading
              ? "..."
              : schedules.filter((schedule) => schedule.isActive).length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
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
                      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
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
                          Phòng {schedule.room} · #{schedule.classId}
                        </div>
                      </div>

                      {!schedule.isActive && (
                        <span className="shrink-0 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-500">
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
