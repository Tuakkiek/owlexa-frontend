import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { feeApi } from "../../api/feeApi";
import { scheduleApi } from "../../api/scheduleApi";
import { documentApi } from "../../api/documentApi";
import {
  PageHeader,
  StatCard,
  Card,
  ErrorBanner,
} from "../../components/ui/SharedComponents";
import { Button } from "../../components/ui/Button";
import type { FeeRecordResponse } from "../../types/fee";
import type { ScheduleResponse } from "../../types/schedule";
import type { StudentDocumentResponse } from "../../types/document";
import { formatMoney, remainingBalance } from "../../utils/money";

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

const StudentDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [fees, setFees] = useState<FeeRecordResponse[]>([]);
  const [documents, setDocuments] = useState<StudentDocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [scheduleData, feeData, docData] = await Promise.all([
        scheduleApi.findMySchedulesAsStudent(),
        feeApi.getMyFees(),
        documentApi.getMyDocuments(),
      ]);
      setSchedules(scheduleData);
      setFees(feeData);
      setDocuments(docData);
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

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const weeklySchedulesCount = useMemo(() => {
    return schedules.filter((s) => {
      if (s.type === "CANCELLED" || s.eventStatus === "CANCELLED") return false;
      const d = parseLocalDate(s.eventDate);
      return d && d >= weekStart && d <= weekEnd;
    }).length;
  }, [schedules, weekStart, weekEnd]);

  const nextSessions = useMemo(() => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    return schedules
      .filter((s) => {
        if (s.type === "CANCELLED" || s.eventStatus === "CANCELLED") return false;
        if (!s.eventDate) return true;
        if (s.eventDate < todayKey) return false;
        if (s.eventDate === todayKey && s.startTime < nowTime) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = (a.eventDate ?? "").localeCompare(b.eventDate ?? "");
        if (dateCmp !== 0) return dateCmp;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 3);
  }, [schedules, todayKey]);

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
          value={isLoading ? "..." : weeklySchedulesCount}
          helper="Trong tuần"
        />
        <StatCard
          label="Chưa trả"
          value={isLoading ? "..." : formatMoney(String(totalOwed))}
          helper={`${unpaidFees.length} hóa đơn`}
        />
        <StatCard
          label="Tài liệu"
          value={isLoading ? "..." : documents.length}
          helper="Trong thư viện"
        />
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
                      <p className="font-medium text-gray-900 mb-0.5">
                        {formatDate(session.eventDate) || `Thứ ${session.dayOfWeek + 1}`}
                      </p>
                      <p>
                        {session.startTime.slice(0, 5)} -{" "}
                        {session.endTime.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Phòng: {session.roomName}
                    {session.lessonNumber ? ` · Buổi #${session.lessonNumber}` : ""}
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
