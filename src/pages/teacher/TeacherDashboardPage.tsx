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

const DAY_LABELS: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  THEORY_CLASS: "Lịch học lý thuyết",
  ONLINE_CLASS: "Lịch học trực tuyến",
  EXAM: "Lịch thi",
  CANCELLED: "Lịch tạm ngưng",
};

function parseLocalDate(value?: string | null) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(value?: string | null) {
  const date = parseLocalDate(value);
  if (!date) return "";

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "--:--";
}

function isActiveSchedule(schedule: ScheduleResponse) {
  return schedule.type !== "CANCELLED" && schedule.eventStatus !== "CANCELLED";
}

function sortByDateAndTime(a: ScheduleResponse, b: ScheduleResponse) {
  return (
    (a.eventDate ?? "").localeCompare(b.eventDate ?? "") ||
    a.startTime.localeCompare(b.startTime)
  );
}

function getScheduleTypeLabel(schedule: ScheduleResponse) {
  return SCHEDULE_TYPE_LABELS[schedule.type] ?? "Lịch học";
}

function ScheduleItem({ schedule }: { schedule: ScheduleResponse }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-btn border border-surface-border bg-surface-hover px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900">
          {schedule.className}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Phòng {schedule.roomName || "Chưa gán"}
          {schedule.lessonNumber ? ` · Buổi #${schedule.lessonNumber}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-gray-900">
          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
        </p>
        <p className="mt-1 text-xs font-medium text-primary">
          {getScheduleTypeLabel(schedule)}
        </p>
      </div>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

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

  const activeSchedules = useMemo(
    () => schedules.filter(isActiveSchedule),
    [schedules],
  );

  const weeklySchedules = useMemo(
    () =>
      activeSchedules
        .filter((schedule) => {
          const eventDate = parseLocalDate(schedule.eventDate);
          return eventDate && eventDate >= weekStart && eventDate <= weekEnd;
        })
        .sort(sortByDateAndTime),
    [activeSchedules, weekEnd, weekStart],
  );

  const groupedByDate = useMemo(
    () =>
      weeklySchedules.reduce<Record<string, ScheduleResponse[]>>(
        (acc, schedule) => {
          if (!schedule.eventDate) return acc;
          if (!acc[schedule.eventDate]) acc[schedule.eventDate] = [];
          acc[schedule.eventDate].push(schedule);
          return acc;
        },
        {},
      ),
    [weeklySchedules],
  );

  const classCount = useMemo(
    () => new Set(activeSchedules.map((schedule) => schedule.classId)).size,
    [activeSchedules],
  );

  const todaySchedules = useMemo(
    () =>
      activeSchedules
        .filter((schedule) => schedule.eventDate === todayKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activeSchedules, todayKey],
  );

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
          label="Tổng buổi dạy"
          value={isLoading ? "..." : activeSchedules.length}
        />
        <StatCard
          label="Buổi tuần này"
          value={isLoading ? "..." : weeklySchedules.length}
        />
        <StatCard
          label="Số lớp phụ trách"
          value={isLoading ? "..." : classCount}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lịch dạy tuần này
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(toDateKey(weekStart))} -{" "}
                {formatDate(toDateKey(weekEnd))}
              </p>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={4} height="h-20" />
          ) : weeklySchedules.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-12 text-center text-sm text-gray-500">
              Tuần này chưa có lịch dạy nào.
            </div>
          ) : (
            <div className="space-y-4">
              {weekDays.map((date) => {
                const dateKey = toDateKey(date);
                const daySchedules = groupedByDate[dateKey] ?? [];
                if (daySchedules.length === 0) return null;

                return (
                  <div key={dateKey}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {DAY_LABELS[date.getDay()]} · {formatDate(dateKey)}
                    </h3>
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <ScheduleItem
                          key={`${schedule.eventDate}-${schedule.id}`}
                          schedule={schedule}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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
                Nghỉ ngơi một chút, hoặc chuẩn bị trước cho buổi học tiếp theo.
              </div>
            ) : (
              todaySchedules.map((schedule) => (
                <div
                  key={`${schedule.eventDate}-${schedule.id}`}
                  className="rounded-btn border border-surface-border bg-surface-hover px-4 py-3"
                >
                  <p className="font-semibold text-gray-900">
                    {schedule.className}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatTime(schedule.startTime)} -{" "}
                    {formatTime(schedule.endTime)} · Phòng{" "}
                    {schedule.roomName || "Chưa gán"} ·{" "}
                    {getScheduleTypeLabel(schedule)}
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
