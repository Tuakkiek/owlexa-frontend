import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock, MapPin, User as UserIcon } from "lucide-react";
import { attendanceApi } from "../../api/attendanceApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeader,
  Card,
  ErrorBanner,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
import type { StudentClassSessionResponse } from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";

export default function StudentAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<StudentClassSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await attendanceApi.findStudentClassSessionsByDate(date);
      setSessions(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh của tôi"
        description="Xem lịch học và trạng thái điểm danh trong ngày"
      />

      {error && <ErrorBanner message={error} />}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrevDay}>
              &lt; Ngày trước
            </Button>
            <div className="w-40">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleNextDay}>
              Ngày sau &gt;
            </Button>
            <Button
              variant="outline"
              onClick={() => setDate(new Date().toISOString().split("T")[0])}
            >
              Hôm nay
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : sessions.length === 0 ? (
        <EmptyState
          message="Bạn không có ca học nào trong ngày này."
          icon={CalendarDays}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div
              key={session.scheduleEventId}
              className="group rounded-xl border border-surface-border bg-white p-5 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {session.className}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                    </span>
                  </div>
                </div>
                {session.attendanceStatus ? (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_META[session.attendanceStatus]?.className ??
                      "border-gray-300 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {STATUS_META[session.attendanceStatus]?.label ??
                      session.attendanceStatus}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    Chưa điểm danh
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span>Giáo viên: {session.teacherName || "Chưa xếp"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>Phòng: {session.roomName || "Chưa xếp"}</span>
                </div>
              </div>

              {session.note && (
                <div className="mt-4 border-t border-gray-100 pt-3 text-sm">
                  <span className="font-medium text-gray-700">Ghi chú: </span>
                  <span className="text-gray-600">{session.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
