import { useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleResponse } from "../../../types/schedule";

interface SessionComboboxProps {
  sessions: ScheduleResponse[];
  value: number | null;
  onChange: (scheduleId: number) => void;
  isLoading?: boolean;
}

const DAY_LABELS: Record<number, string> = {
  0: "Chủ Nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value?: string | null) {
  const date = parseLocalDate(value);
  if (!date) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "--:--";
}

function formatDayAndDate(schedule: ScheduleResponse) {
  const dayName = DAY_LABELS[schedule.dayOfWeek] ?? "";
  const formattedDate = formatDate(schedule.eventDate);
  if (dayName && formattedDate) {
    return `${dayName}, ${formattedDate}`;
  }
  return formattedDate || dayName || "Buổi học";
}

export function SessionCombobox({
  sessions,
  value,
  onChange,
  isLoading = false,
}: SessionComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const selectedSchedule = useMemo(
    () => sessions.find((s) => s.id === value) ?? null,
    [sessions, value],
  );

  const hasMultipleClasses = useMemo(() => {
    return new Set(sessions.map((s) => s.className)).size > 1;
  }, [sessions]);

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setFocusedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;

    return sessions.filter((s) => {
      const dateStr = s.eventDate ?? "";
      const formattedD = formatDate(s.eventDate).toLowerCase();
      const dayName = (DAY_LABELS[s.dayOfWeek] ?? "").toLowerCase();
      const className = s.className.toLowerCase();
      const timeStr = `${formatTime(s.startTime)}-${formatTime(s.endTime)}`;

      return (
        dateStr.toLowerCase().includes(query) ||
        formattedD.includes(query) ||
        dayName.includes(query) ||
        className.includes(query) ||
        timeStr.includes(query)
      );
    });
  }, [sessions, searchQuery]);

  // Grouped sessions: Today, Upcoming, Past
  const { todaySessions, upcomingSessions, pastSessions } = useMemo(() => {
    const today: ScheduleResponse[] = [];
    const upcoming: ScheduleResponse[] = [];
    const past: ScheduleResponse[] = [];

    filteredSchedules.forEach((s) => {
      const eventDate = s.eventDate ?? "";
      if (!eventDate) {
        upcoming.push(s);
      } else if (eventDate === todayKey) {
        today.push(s);
      } else if (eventDate > todayKey) {
        upcoming.push(s);
      } else {
        past.push(s);
      }
    });

    // Today: sort by start time
    today.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Upcoming: sort ascending by date & start time (closest date first)
    upcoming.sort(
      (a, b) =>
        (a.eventDate ?? "").localeCompare(b.eventDate ?? "") ||
        a.startTime.localeCompare(b.startTime),
    );

    // Past: sort descending by date & start time (closest to today first)
    past.sort(
      (a, b) =>
        (b.eventDate ?? "").localeCompare(a.eventDate ?? "") ||
        b.startTime.localeCompare(a.startTime),
    );

    return {
      todaySessions: today,
      upcomingSessions: upcoming,
      pastSessions: past,
    };
  }, [filteredSchedules, todayKey]);

  // Flattened array for keyboard navigation
  const allFilteredOptions = useMemo(() => {
    return [...todaySessions, ...upcomingSessions, ...pastSessions];
  }, [todaySessions, upcomingSessions, pastSessions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < allFilteredOptions.length - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : allFilteredOptions.length - 1,
      );
      return;
    }

    if (
      e.key === "Enter" &&
      focusedIndex >= 0 &&
      focusedIndex < allFilteredOptions.length
    ) {
      e.preventDefault();
      const target = allFilteredOptions[focusedIndex];
      if (target) {
        onChange(target.id);
        setIsOpen(false);
      }
    }
  };

  const handleSelectOption = (scheduleId: number) => {
    onChange(scheduleId);
    setIsOpen(false);
  };

  const renderScheduleItem = (
    schedule: ScheduleResponse,
    isPast = false,
  ) => {
    const isSelected = schedule.id === value;
    const itemIndex = allFilteredOptions.findIndex((s) => s.id === schedule.id);
    const isFocused = itemIndex === focusedIndex;
    const isToday = schedule.eventDate === todayKey;

    return (
      <div
        key={schedule.id}
        onClick={() => handleSelectOption(schedule.id)}
        className={`px-3.5 py-2.5 text-left transition-colors cursor-pointer border-b border-surface-border/40 last:border-0 ${
          isSelected
            ? "bg-primary-light font-medium"
            : isFocused
              ? "bg-surface-hover"
              : "hover:bg-surface-hover"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm font-medium ${
              isSelected
                ? "text-primary"
                : isPast
                  ? "text-gray-500"
                  : "text-gray-900"
            }`}
          >
            {formatDayAndDate(schedule)}
          </span>
          {isToday && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
              Hôm nay
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
          <span>
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </span>
          {hasMultipleClasses && (
            <>
              <span>·</span>
              <span className="font-normal text-gray-600">
                {schedule.className}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Buổi học
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isLoading || sessions.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full rounded-input border border-surface-border bg-white px-3.5 py-2 text-left transition-colors hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 flex items-center justify-between gap-2 min-h-[52px]"
      >
        {selectedSchedule ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-gray-900">
                {formatDayAndDate(selectedSchedule)}
              </span>
              {selectedSchedule.eventDate === todayKey && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Hôm nay
                </span>
              )}
            </div>
            <div className="truncate text-xs text-gray-500">
              {formatTime(selectedSchedule.startTime)} –{" "}
              {formatTime(selectedSchedule.endTime)}
              {" · "}
              {selectedSchedule.className}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">
            {isLoading ? "Đang tải danh sách buổi học..." : "Chọn buổi học..."}
          </span>
        )}

        {/* Dropdown Arrow Icon */}
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-[380px] w-full overflow-y-auto rounded-input border border-surface-border bg-white shadow-md">
          {/* Sticky Search Header */}
          <div className="sticky top-0 z-10 border-b border-surface-border bg-white p-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo ngày hoặc tên lớp..."
                className="w-full rounded-input border border-surface-border bg-white py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* List Content */}
          {allFilteredOptions.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              {searchQuery ? "Không tìm thấy buổi học phù hợp." : "Hiện chưa có buổi học nào."}
            </div>
          ) : (
            <div>
              {/* Group: HÔM NAY */}
              {todaySessions.length > 0 && (
                <div>
                  <div className="sticky top-[49px] z-[5] border-b border-surface-border/60 bg-gray-50/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Hôm nay
                  </div>
                  {todaySessions.map((s) => renderScheduleItem(s, false))}
                </div>
              )}

              {/* Group: SẮP TỚI */}
              {upcomingSessions.length > 0 && (
                <div>
                  <div className="sticky top-[49px] z-[5] border-b border-surface-border/60 bg-gray-50/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Sắp tới
                  </div>
                  {upcomingSessions.map((s) => renderScheduleItem(s, false))}
                </div>
              )}

              {/* Group: ĐÃ QUA */}
              {pastSessions.length > 0 && (
                <div>
                  <div className="sticky top-[49px] z-[5] border-b border-surface-border/60 bg-gray-50/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Đã qua
                  </div>
                  {pastSessions.map((s) => renderScheduleItem(s, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
