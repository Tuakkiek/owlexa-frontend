import { useEffect, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
interface ScheduleItem {
  id: number;
  classId: number;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  isActive: boolean;
}

const DAY_NAMES = [
  "",
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded animate-pulse">
    <div className="w-16 h-10 bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="w-1/3 h-3 bg-gray-200" />
      <div className="w-1/4 h-3 bg-gray-200" />
    </div>
    <div className="w-20 h-3 bg-gray-200" />
  </div>
);

export const TeacherSchedulePage = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await axiosClient.get("/teacher/schedules/me");
      setSchedules(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể tải lịch dạy.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = schedules.reduce<Record<number, ScheduleItem[]>>(
    (acc, item) => {
      if (!acc[item.dayOfWeek]) {
        acc[item.dayOfWeek] = [];
      }

      acc[item.dayOfWeek].push(item);
      return acc;
    },
    {},
  );

  const sortedDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch dạy của tôi</h1>

          <p className="text-sm text-gray-600">Thời khóa biểu theo tuần</p>
        </div>

        <button
          onClick={load}
          disabled={isLoading}
          className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-gray-300 rounded bg-gray-100 text-sm">
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
        <div className="py-16 text-center text-gray-500">Chưa có lịch dạy.</div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day}>
              <h2 className="pb-2 mb-3 font-semibold border-b border-gray-300">
                {DAY_NAMES[day]}
              </h2>

              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center gap-4 p-4 border border-gray-300 rounded"
                    >
                      <div className="min-w-[60px] text-center">
                        <div className="text-sm">
                          {schedule.startTime.slice(0, 5)}
                        </div>

                        <div className="text-xs">-</div>

                        <div className="text-sm">
                          {schedule.endTime.slice(0, 5)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {schedule.className}
                        </div>

                        <div className="text-sm text-gray-600">
                          Phòng {schedule.room}
                        </div>
                      </div>

                      {!schedule.isActive && (
                        <span className="px-2 py-1 text-xs border border-gray-300 rounded">
                          Tạm dừng
                        </span>
                      )}
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

export default TeacherSchedulePage;
