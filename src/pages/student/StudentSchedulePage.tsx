import { useEffect, useState, useCallback } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import type { ScheduleResponse } from "../../types/schedule";
import { DAY_LABELS, SCHEDULE_TYPE_LABELS } from "../../types/schedule";

export const StudentSchedulePage = () => {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await scheduleApi.findMySchedulesAsStudent();
      setSchedules(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải thời khoá biểu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = schedules.reduce<Record<number, ScheduleResponse[]>>(
    (acc, s) => {
      if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
      acc[s.dayOfWeek].push(s);
      return acc;
    },
    {},
  );

  const sortedDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h1 className="text-xl font-bold">Thời khoá biểu</h1>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-500 p-2 text-red-600 mb-4 text-sm">
          Lỗi: {error}
        </div>
      )}

      {/* Loading & Content State */}
      {isLoading ? (
        <div className="text-sm">Đang tải dữ liệu...</div>
      ) : schedules.length === 0 ? (
        <div className="rounded-lg text-sm border p-4 text-center text-gray-500">
          Bạn chưa được đăng ký vào lớp nào.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDays.map((day) => (
            <div key={day} className="rounded-lg border p-2">
              <h2 className="font-bold text-sm mb-2 border-b pb-1">
                {DAY_LABELS[day] ?? `Ngày ${day}`}
              </h2>
              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="text-sm border-b last:border-0 pb-1 last:pb-0"
                    >
                      <div>
                        <strong>
                          {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                        </strong>
                        {" : "}
                        <span>{s.className}</span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                        <span>Giáo viên: {s.teacherUserFullName} | Phòng: {s.roomName}</span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                          {SCHEDULE_TYPE_LABELS[s.type]}
                        </span>
                        {s.type === "CANCELLED" && (
                          <span className="text-red-500 font-bold">(Tạm ngưng)</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSchedulePage;
