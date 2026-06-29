import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export default function TeacherDashboardPage() {
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

  const grouped = useMemo(
    () =>
      schedules.reduce<Record<number, TeacherScheduleItem[]>>((acc, item) => {
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
    () => schedules.filter((schedule) => schedule.isActive),
    [schedules],
  );

  const todaySchedules = useMemo(() => {
    const today = new Date().getDay();
    return schedules
      .filter((schedule) => schedule.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules]);

  const classCount = useMemo(
    () => new Set(schedules.map((schedule) => schedule.classId)).size,
    [schedules],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Chào, {user?.fullName ?? "giáo viên"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Đây là bảng điều khiển của giáo viên
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tổng lịch dạy
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading ? "..." : schedules.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Buổi dạy đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading ? "..." : activeSchedules.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Số lớp phụ trách
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {isLoading ? "..." : classCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lịch dạy tuần này
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sắp xếp theo từng ngày để dễ nhìn hơn khi vào ca dạy
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-gray-100"
                />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-sm text-gray-600">
                Chưa có lịch dạy nào được gán cho tài khoản của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDays.map((day) => (
                <div key={day}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {DAY_NAMES[day]}
                  </h3>
                  <div className="space-y-2">
                    {grouped[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
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
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Hôm nay</h2>
            <p className="mt-1 text-sm text-gray-500">
              {todaySchedules.length > 0
                ? `Bạn có ${todaySchedules.length} buổi dạy trong hôm nay.`
                : "Hôm nay chưa có buổi dạy nào."}
            </p>

            <div className="mt-4 space-y-2">
              {todaySchedules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  Nghỉ ngơi một chút, hoặc chuẩn bị trước cho buổi học kế tiếp.
                </div>
              ) : (
                todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
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
          </div>

          <div className="grid gap-3">
            <Link
              to="/teacher/attendance"
              className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">Điểm danh</p>
                <p className="mt-1 text-sm text-gray-500">
                  Ghi nhận có mặt, vắng mặt hoặc xin phép
                </p>
              </div>
              <span className="text-lg font-semibold text-gray-400">→</span>
            </Link>

            <Link
              to="/teacher/students"
              className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Danh sách học sinh
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Xem học sinh theo từng lớp
                </p>
              </div>
              <span className="text-lg font-semibold text-gray-400">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
