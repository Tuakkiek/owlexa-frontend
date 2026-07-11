import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { feeApi } from "../../api/feeApi";
import { scheduleApi } from "../../api/scheduleApi";
import type { FeeRecordResponse } from "../../types/fee";
import type { ScheduleResponse } from "../../types/schedule";
import { formatMoney, remainingBalance } from "../../utils/money";

const DashboardCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) => (
  <div className="border p-4 bg-white">
    <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
    <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
  </div>
);

const StudentDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [scheduleData, feeData] = await Promise.all([
        scheduleApi.findMySchedulesAsStudent(),
        feeApi.getMyFees(),
      ]);

      setSchedules(scheduleData);
      setFees(feeData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu học sinh.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unpaidFees = useMemo(
    () => fees.filter((item) => item.status !== "PAID"),
    [fees],
  );

  const totalOwed = useMemo(
    () =>
      unpaidFees.reduce(
        (sum, item) => sum + Math.max(remainingBalance(item), 0),
        0,
      ),
    [unpaidFees],
  );

  const nextSessions = useMemo(() => {
    return schedules
      .slice()
      .sort((a, b) => {
        const aKey = `${a.dayOfWeek}-${a.startTime}`;
        const bKey = `${b.dayOfWeek}-${b.startTime}`;
        return aKey.localeCompare(bKey);
      })
      .slice(0, 3);
  }, [schedules]);

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* Welcome Banner & Cards */}
      <div className="border p-4 bg-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Xin chào,</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.fullName || "Học sinh"}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Đây là bảng điều khiển dành cho học sinh. Xem lịch học, học phí và
              tài liệu nhanh.
            </p>
          </div>
          <div className="grid gap-2 grid-cols-3">
            <DashboardCard
              title="Buổi học"
              value={isLoading ? "..." : `${schedules.length}`}
              description="Trong tuần"
            />
            <DashboardCard
              title="Chưa trả"
              value={isLoading ? "..." : formatMoney(String(totalOwed))}
              description={`${unpaidFees.length} hóa đơn`}
            />
            <DashboardCard title="Tài liệu" value="—" description="Danh sách" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Lịch học sắp tới */}
        <section className="border p-4 bg-white">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Lịch học sắp tới
              </h2>
              <p className="text-xs text-gray-500">
                3 buổi học đầu tiên trong tuần
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="border border-black px-3 py-1 text-xs disabled:opacity-50"
            >
              {isLoading ? "Đang tải..." : "Cập nhật"}
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-xs text-gray-500">Đang tải lịch học...</div>
            ) : nextSessions.length === 0 ? (
              <div className="border border-dashed p-6 text-center text-gray-500">
                Chưa có lịch học. Hãy kiểm tra lại sau.
              </div>
            ) : (
              nextSessions.map((session) => (
                <div key={session.id} className="border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        {session.className}
                      </p>
                      <p className="font-bold text-gray-900">
                        {session.teacherUserFullName}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p className="font-medium">{session.dayOfWeek}. ngày</p>
                      <p>
                        {session.startTime.slice(0, 5)} -{" "}
                        {session.endTime.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 border-t border-dashed pt-1">
                    Phòng: {session.room}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Học phí đang chờ */}
        <section className="border p-4 bg-white">
          <div className="border-b pb-2 mb-4">
            <h2 className="text-base font-bold text-gray-900">
              Học phí đang chờ
            </h2>
            <p className="text-xs text-gray-500">Theo dữ liệu từ hệ thống</p>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-xs text-gray-500">Đang tải học phí...</div>
            ) : unpaidFees.length === 0 ? (
              <div className="border border-dashed p-6 text-center text-gray-500">
                Không có hóa đơn nợ.
              </div>
            ) : (
              unpaidFees.slice(0, 3).map((item) => (
                <div key={item.id} className="border p-3">
                  <p className="text-xs uppercase text-gray-500">
                    {item.className}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <p className="font-bold text-gray-900">
                      Còn nợ: {formatMoney(String(remainingBalance(item)))}
                    </p>
                    <span className="text-xs border px-1.5 py-0.5">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 border-t border-dashed pt-1">
                    Hạn: {item.dueDate}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border border-red-500 p-2 text-red-600 text-xs">
          Lỗi: {error}
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
