import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { feeApi } from "../../api/feeApi";
import { scheduleApi } from "../../api/scheduleApi";
import {
  PageHeader,
  StatCard,
  Card,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { FeeRecordResponse } from "../../types/fee";
import type { ScheduleResponse } from "../../types/schedule";
import { formatMoney, remainingBalance } from "../../utils/money";

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
      setError(err?.response?.data?.message ?? "Không thể tải dữ liệu.");
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

  const nextSessions = useMemo(
    () =>
      schedules
        .slice()
        .sort((a, b) =>
          `${a.dayOfWeek}-${a.startTime}`.localeCompare(
            `${b.dayOfWeek}-${b.startTime}`,
          ),
        )
        .slice(0, 3),
    [schedules],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={`Xin chào, ${user?.fullName || "Học sinh"}`}>
        <Button
          variant="secondary"
          onClick={loadData}
          isLoading={isLoading}
          size="sm"
        >
          Cập nhật
        </Button>
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Buổi học"
          value={isLoading ? "..." : schedules.length}
          helper="Trong tuần"
        />
        <StatCard
          label="Chưa trả"
          value={isLoading ? "..." : formatMoney(String(totalOwed))}
          helper={`${unpaidFees.length} hóa đơn`}
        />
        <StatCard label="Tài liệu" value="—" helper="Danh sách" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lịch học sắp tới
          </h2>
          {isLoading ? (
            <div className="text-sm text-gray-400">Đang tải lịch học...</div>
          ) : nextSessions.length === 0 ? (
            <div className="rounded-btn border border-dashed border-surface-border bg-surface-page py-8 text-center text-sm text-gray-500">
              Chưa có lịch học.
            </div>
          ) : (
            <div className="space-y-3">
              {nextSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-btn border border-surface-border bg-surface-hover p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {session.className}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {session.teacherUserFullName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>
                        {session.startTime.slice(0, 5)} -{" "}
                        {session.endTime.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Phòng: {session.roomName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Học phí đang chờ
          </h2>
          {isLoading ? (
            <div className="text-sm text-gray-400">Đang tải học phí...</div>
          ) : unpaidFees.length === 0 ? (
            <div className="rounded-btn border border-dashed border-surface-border bg-surface-page py-8 text-center text-sm text-gray-500">
              Không có hóa đơn nợ.
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidFees.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-btn border border-surface-border bg-surface-hover p-4"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {item.className}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Còn nợ: {formatMoney(String(remainingBalance(item)))}
                    </p>
                    <span className="rounded-full border border-surface-border px-2 py-0.5 text-xs text-gray-500">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Hạn: {item.dueDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
