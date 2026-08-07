import { useMemo, useState } from "react";
import type { ScheduleResponse, ScheduleType } from "../../types/schedule";
import { SCHEDULE_TYPE_LABELS } from "../../types/schedule";

type FilterKey = "ALL" | "STUDY" | "EXAM";

interface ModernWeeklyScheduleProps {
  title: string;
  description: string;
  schedules: ScheduleResponse[];
  isLoading: boolean;
  emptyMessage: string;
  onRefresh: () => void;
}

const WEEKDAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const SHIFTS = [
  { key: "morning", label: "Sáng", time: "06:30 - 11:30", filledMinHeight: 250 },
  { key: "afternoon", label: "Chiều", time: "13:00 - 17:00", filledMinHeight: 220 },
  { key: "evening", label: "Tối", time: "17:30 - 21:30", filledMinHeight: 220 },
] as const;

const EMPTY_SHIFT_HEIGHT = 58;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "STUDY", label: "Lịch học" },
  { key: "EXAM", label: "Lịch thi" },
];

const TYPE_BADGE: Record<ScheduleType, string> = {
  THEORY_CLASS: "bg-primary-light text-primary",
  ONLINE_CLASS: "bg-blue-50 text-blue-700",
  EXAM: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() + (day === 0 ? -6 : 1 - day));
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const formatRange = (start: Date) => {
  const end = addDays(start, 6);
  return `${formatDate(start)} - ${formatDate(end)}/${end.getFullYear()}`;
};

const minutesOf = (time: string) => {
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
};

const shiftOf = (schedule: ScheduleResponse) => {
  const start = minutesOf(schedule.startTime);
  if (start < 12 * 60) return "morning";
  if (start < 18 * 60) return "afternoon";
  return "evening";
};

const periodLabel = (schedule: ScheduleResponse) => {
  const start = minutesOf(schedule.startTime);
  const end = minutesOf(schedule.endTime);
  const isMorning = start < 12 * 60;
  const isAfternoon = start >= 12 * 60 && start < 18 * 60;
  const base = isMorning ? 7 * 60 : isAfternoon ? 13 * 60 : 18 * 60;
  const offset = isMorning ? 1 : isAfternoon ? 6 : 9;
  const startPeriod = Math.max(offset, Math.floor((start - base) / 50) + offset);
  const endPeriod = Math.max(startPeriod, Math.ceil((end - base) / 50) + offset - 1);
  return `Tiết ${startPeriod} - ${endPeriod}`;
};

const matchesFilter = (schedule: ScheduleResponse, filter: FilterKey) => {
  if (filter === "ALL") return true;
  if (filter === "EXAM") return schedule.type === "EXAM";
  return schedule.type !== "EXAM";
};

const matchesSearch = (schedule: ScheduleResponse, query: string) => {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return [
    schedule.className,
    schedule.teacherUserFullName,
    schedule.roomName,
    schedule.roomCode,
    SCHEDULE_TYPE_LABELS[schedule.type],
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
};

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const matchesWeek = (schedule: ScheduleResponse, weekStart: Date) => {
  if (!schedule.eventDate) return true;
  const start = dateInputValue(weekStart);
  const end = dateInputValue(addDays(weekStart, 6));
  return schedule.eventDate >= start && schedule.eventDate <= end;
};

const Icon = ({ type }: { type: "calendar" | "print" | "search" | "chevronLeft" | "chevronRight" | "clock" | "pin" | "teacher" }) => {
  const common = "h-4 w-4";
  if (type === "calendar") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 2v4M16 2v4M3 10h18" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
      </svg>
    );
  }
  if (type === "print") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
    );
  }
  if (type === "search") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }
  if (type === "chevronLeft" || type === "chevronRight") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={type === "chevronLeft" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    );
  }
  if (type === "clock") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (type === "pin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
};

export const ModernWeeklySchedule = ({
  title,
  description,
  schedules,
  isLoading,
  emptyMessage,
  onRefresh,
}: ModernWeeklyScheduleProps) => {
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const visibleSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          matchesFilter(schedule, filter) &&
          matchesSearch(schedule, search) &&
          matchesWeek(schedule, weekStart),
      ),
    [filter, schedules, search, weekStart],
  );

  const schedulesByCell = useMemo(() => {
    const map = new Map<string, ScheduleResponse[]>();
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      SHIFTS.forEach((shift) => map.set(`${dayIndex + 1}-${shift.key}`, []));
    }

    visibleSchedules.forEach((schedule) => {
      const key = `${schedule.dayOfWeek}-${shiftOf(schedule)}`;
      map.get(key)?.push(schedule);
    });

    map.forEach((items) => items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [visibleSchedules]);

  const totalVisible = Array.from(schedulesByCell.values()).reduce(
    (sum, items) => sum + items.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setWeekStart(startOfWeek(new Date()));
              onRefresh();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-btn border border-surface-border bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-surface-hover"
          >
            <Icon type="calendar" />
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-2 rounded-btn border border-primary bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Icon type="print" />
            In lịch
          </button>
        </div>
      </div>

      <div className="rounded-card border border-surface-border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 grid gap-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
          <div className="inline-flex w-fit rounded-btn bg-gray-100 p-1">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`h-10 rounded-[10px] px-5 text-sm font-medium transition-all ${
                  filter === item.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex justify-start xl:justify-center">
            <div className="inline-flex overflow-hidden rounded-btn border border-surface-border bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="flex h-11 w-12 items-center justify-center text-gray-500 transition-colors hover:bg-surface-hover hover:text-gray-900"
                aria-label="Tuần trước"
              >
                <Icon type="chevronLeft" />
              </button>
              <div className="flex h-11 min-w-[190px] items-center justify-center border-x border-surface-border px-4 text-sm font-semibold text-gray-900">
                {formatRange(weekStart)}
              </div>
              <button
                type="button"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="flex h-11 w-12 items-center justify-center text-gray-500 transition-colors hover:bg-surface-hover hover:text-gray-900"
                aria-label="Tuần sau"
              >
                <Icon type="chevronRight" />
              </button>
            </div>
          </div>

          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon type="search" />
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm môn học, giảng viên, phòng..."
              className="h-11 w-full rounded-btn border border-surface-border bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary xl:w-[360px]"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="h-[560px] animate-pulse rounded-card bg-surface-hover" />
        ) : totalVisible === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-surface-page py-16 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[1120px] overflow-hidden rounded-card border border-surface-border">
                <div className="grid grid-cols-[132px_repeat(7,minmax(132px,1fr))] border-b border-surface-border bg-white">
                  <div className="flex items-center justify-center border-r border-surface-border px-4 py-5 text-sm font-semibold text-gray-700">
                    Thời gian
                  </div>
                  {weekDays.map((date, index) => (
                    <div
                      key={date.toISOString()}
                      className="border-r border-surface-border px-4 py-4 text-center last:border-r-0"
                    >
                      <div className="text-sm font-semibold text-gray-900">{WEEKDAY_LABELS[index]}</div>
                      <div className="mt-1 text-sm text-gray-500">{formatDate(date)}</div>
                    </div>
                  ))}
                </div>

                {SHIFTS.map((shift) => {
                  const shiftItemCount = weekDays.reduce(
                    (sum, _, dayIndex) =>
                      sum + (schedulesByCell.get(`${dayIndex + 1}-${shift.key}`)?.length ?? 0),
                    0,
                  );
                  const rowMinHeight = shiftItemCount > 0 ? shift.filledMinHeight : EMPTY_SHIFT_HEIGHT;

                  return (
                    <div
                      key={shift.key}
                      className="grid grid-cols-[132px_repeat(7,minmax(132px,1fr))] border-b border-surface-border transition-[min-height] duration-200 last:border-b-0"
                      style={{ minHeight: rowMinHeight }}
                    >
                      <div className="flex flex-col items-center justify-center border-r border-surface-border bg-gray-50 px-4 text-center">
                        <span className="text-base font-semibold text-gray-800">{shift.label}</span>
                        <span className="mt-1 text-xs text-gray-500">{shift.time}</span>
                      </div>
                      {weekDays.map((_, dayIndex) => {
                        const items = schedulesByCell.get(`${dayIndex + 1}-${shift.key}`) ?? [];
                        return (
                          <div
                            key={`${shift.key}-${dayIndex}`}
                            className="border-r border-surface-border bg-white p-3 last:border-r-0"
                          >
                            <div className="space-y-3">
                              {items.map((schedule) => (
                                <ScheduleCard key={schedule.id} schedule={schedule} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {weekDays.map((date, dayIndex) => {
                const dayItems = SHIFTS.flatMap(
                  (shift) => schedulesByCell.get(`${dayIndex + 1}-${shift.key}`) ?? [],
                );
                if (dayItems.length === 0) return null;
                return (
                  <section key={date.toISOString()} className="rounded-card border border-surface-border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-900">{WEEKDAY_LABELS[dayIndex]}</h2>
                      <span className="text-xs text-gray-500">{formatDate(date)}</span>
                    </div>
                    <div className="space-y-3">
                      {dayItems.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ScheduleCard = ({ schedule }: { schedule: ScheduleResponse }) => (
  <article className="rounded-card border border-surface-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold leading-5 text-gray-900">{schedule.className}</h3>
        <p className="mt-1 text-xs text-gray-500">
          {schedule.lessonNumber ? `Lesson #${schedule.lessonNumber}` : `Mã lớp #${schedule.classId}`}
        </p>
      </div>
      <div className="space-y-1.5 border-t border-surface-border pt-2 text-xs text-gray-600">
        <p className="flex items-center gap-1.5">
          <span className="text-primary"><Icon type="clock" /></span>
          {periodLabel(schedule)}
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-primary"><Icon type="pin" /></span>
          Phòng: {schedule.roomName}
        </p>
        <p className="flex items-center gap-1.5">
          <span className="text-primary"><Icon type="teacher" /></span>
          GV: {schedule.teacherUserFullName}
        </p>
      </div>
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_BADGE[schedule.type]}`}>
        {SCHEDULE_TYPE_LABELS[schedule.type]}
      </span>
    </div>
  </article>
);
