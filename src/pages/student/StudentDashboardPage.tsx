import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { feeApi } from "../../api/feeApi";
import axiosClient from "../../api/axiosClient";
import type { FeeRecordResponse } from "../../types/fee";
import type { ScheduleItem } from "./StudentSchedulePage";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const DashboardCard = ({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-4 text-3xl font-semibold text-gray-900">{value}</p>
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
  </div>
);

const StudentDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [scheduleResponse, feeResponse] = await Promise.all([
        axiosClient.get<ScheduleItem[]>("/student/schedules/me"),
        feeApi.getMyFees(),
      ]);

      setSchedules(scheduleResponse.data ?? []);
      setFees(feeResponse ?? []);
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
        (sum, item) => sum + Math.max(item.amount - item.paidAmount, 0),
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
    <div className="space-y-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Xin chào,</p>
            <h1 className="text-3xl font-semibold text-gray-900">
              {user?.fullName || "Học sinh"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Đây là bảng điều khiển dành cho học sinh. Xem lịch học, học phí và
              tài liệu nhanh.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardCard
              title="Buổi học"
              value={isLoading ? "..." : `${schedules.length}`}
              description="Buổi học trong tuần"
            />
            <DashboardCard
              title="Học phí chưa trả"
              value={isLoading ? "..." : formatCurrency(totalOwed)}
              description={`${unpaidFees.length} hóa đơn`}
            />
            <DashboardCard
              title="Tài liệu"
              value="—"
              description="Xem danh sách tài liệu"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Lịch học sắp tới
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                3 buổi học đầu tiên trong tuần
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? "Đang tải..." : "Cập nhật"}
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))
            ) : nextSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                Chưa có lịch học. Hãy kiểm tra lại sau.
              </div>
            ) : (
              nextSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {session.className}
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {session.teacherUserFullName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{session.dayOfWeek}. ngày</p>
                      <p>
                        {session.startTime.slice(0, 5)} -{" "}
                        {session.endTime.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Phòng {session.room}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Học phí đang chờ
          </h2>
          <p className="mt-1 text-sm text-gray-500">Theo dữ liệu từ backend</p>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : unpaidFees.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
              Không có hóa đơn nợ.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {unpaidFees.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <p className="text-sm text-gray-500">{item.className}</p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-base font-semibold text-gray-900">
                      {formatCurrency(item.amount - item.paidAmount)}
                    </p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Hạn: {item.dueDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
