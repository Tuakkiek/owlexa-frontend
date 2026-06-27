import { useEffect, useState, useCallback, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/authStore";

interface TeacherScheduleItem {
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
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

const TeacherDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<TeacherScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axiosClient.get<TeacherScheduleItem[]>(
        "/teacher/schedules/me",
      );
      setSchedules(res.data ?? []);
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

  const grouped = useMemo(() => {
    return schedules.reduce<Record<number, TeacherScheduleItem[]>>((acc, s) => {
      if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = [];
      acc[s.dayOfWeek].push(s);
      return acc;
    }, {});
  }, [schedules]);

  const sortedDays = useMemo(
    () =>
      Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b),
    [grouped],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Xin chào, {user?.fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Đây là bảng điều khiển của giáo viên
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Tổng lớp
          </p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {isLoading ? "..." : schedules.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Buổi dạy tuần này
          </p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {isLoading ? "..." : schedules.filter((s) => s.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
            Tài liệu đã tải
          </p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">—</p>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Lịch dạy tuần này
        </h2>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-600">
              Chưa có lịch dạy. Hãy liên hệ quản lý trung tâm.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDays.map((day) => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {DAY_NAMES[day]}
                </h3>
                <div className="space-y-2">
                  {grouped[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((s) => (
                      <div
                        key={s.id}
                        className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-white p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {s.className}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Phòng {s.room}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                          </p>
                          {!s.isActive && (
                            <p className="text-xs text-gray-400 mt-1">
                              Tạm dừng
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <a
          href="/teacher/attendance"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl"></p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Điểm danh
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Ghi nhận học sinh có mặt/vắng
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>

        <a
          href="/teacher/students"
          className="rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl"></p>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Danh sách học sinh
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Xem học sinh từng lớp
              </p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
