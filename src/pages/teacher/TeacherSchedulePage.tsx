import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import {
  PageHeader,
  StatCard,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { ScheduleResponse, ScheduleType } from "../../types/schedule";
import { DAY_LABELS, SCHEDULE_TYPE_LABELS } from "../../types/schedule";

const TYPE_COLORS: Record<ScheduleType, { card: string; text: string; dot: string }> = {
  THEORY_CLASS: { card: "bg-emerald-50/80 border-emerald-200 hover:bg-emerald-50", text: "text-emerald-900", dot: "bg-emerald-500" },
  ONLINE_CLASS: { card: "bg-blue-50/80 border-blue-200 hover:bg-blue-50", text: "text-blue-900", dot: "bg-blue-500" },
  EXAM: { card: "bg-amber-50/80 border-amber-200 hover:bg-amber-50", text: "text-amber-900", dot: "bg-amber-500" },
  CANCELLED: { card: "bg-rose-50/80 border-rose-200 hover:bg-rose-50 opacity-70", text: "text-rose-900", dot: "bg-rose-500" },
};

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ScheduleType | "ALL">("ALL");

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

  const filteredSchedules = useMemo(() => {
    if (selectedType === "ALL") return schedules;
    return schedules.filter((s) => s.type === selectedType);
  }, [schedules, selectedType]);

  const grouped = useMemo(
    () =>
      filteredSchedules.reduce<Record<number, ScheduleResponse[]>>((acc, item) => {
        if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
        acc[item.dayOfWeek].push(item);
        return acc;
      }, {}),
    [filteredSchedules],
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

  const activeSchedulesCount = useMemo(
    () => schedules.filter((s) => s.type !== "CANCELLED").length,
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
          value={isLoading ? "..." : activeSchedulesCount}
        />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {(["ALL", "THEORY_CLASS", "ONLINE_CLASS", "EXAM", "CANCELLED"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
              selectedType === t
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t === "ALL" ? "Tất cả" : SCHEDULE_TYPE_LABELS[t]}
          </button>
        ))}
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
      ) : filteredSchedules.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
          Chưa có lịch dạy nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {DAY_LABELS[day]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => {
                    const colors = TYPE_COLORS[schedule.type] || { card: "bg-white border-gray-200", text: "text-gray-900", dot: "bg-gray-400" };
                    return (
                      <div
                        key={schedule.id}
                        className={`flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ${colors.card}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              {schedule.startTime.slice(0, 5)} – {schedule.endTime.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                              {SCHEDULE_TYPE_LABELS[schedule.type]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              {schedule.className}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              Phòng: <span className="font-semibold">{schedule.roomName}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Mã lớp: #{schedule.classId}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-gray-200 bg-white p-4 text-xs font-medium text-gray-600 shadow-sm">
        <span className="text-gray-500">Chú thích lịch:</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Lý thuyết (Green)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Trực tuyến (Blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span>Lịch thi (Yellow)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span>Tạm ngưng (Red)</span>
        </div>
      </div>
    </div>
  );
}
