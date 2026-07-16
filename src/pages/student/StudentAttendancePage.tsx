import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { attendanceApi } from "../../api/attendanceApi";
import { Input } from "../../components/ui/Input";
import {
  PageHeader,
  StatCard,
  Card,
  ErrorBanner,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
import type { ScheduleResponse } from "../../types/schedule";
import type {
  AttendanceResponse,
  AttendanceStatus,
} from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";

export default function StudentAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceResponse[]
  >([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [error, setError] = useState("");

  // Load student's schedules to get class list
  const loadSchedules = useCallback(async () => {
    try {
      setIsLoadingSchedules(true);
      setError("");
      const data = await scheduleApi.findMySchedulesAsStudent();
      setSchedules(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách lớp học.",
      );
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Extract unique classes from schedules
  const classOptions = useMemo(() => {
    const map = new Map<number, { classId: number; className: string }>();
    schedules.forEach((s) => {
      if (!map.has(s.classId)) {
        map.set(s.classId, { classId: s.classId, className: s.className });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.className.localeCompare(b.className),
    );
  }, [schedules]);

  // Auto-select first class
  useEffect(() => {
    if (classOptions.length > 0 && selectedClassId === null) {
      setSelectedClassId(classOptions[0].classId);
    }
  }, [classOptions, selectedClassId]);

  // Load attendance
  const loadAttendance = useCallback(async () => {
    if (!selectedClassId) {
      setAttendanceRecords([]);
      return;
    }
    try {
      setIsLoadingAttendance(true);
      setError("");
      const records = await attendanceApi.findMyAttendances(
        selectedClassId,
        date,
      );
      setAttendanceRecords(records);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
      setAttendanceRecords([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedClassId, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Summary counts
  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    attendanceRecords.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return counts;
  }, [attendanceRecords]);

  const selectedClassName = useMemo(
    () =>
      classOptions.find((c) => c.classId === selectedClassId)?.className ?? "",
    [classOptions, selectedClassId],
  );

  const isLoading = isLoadingSchedules || isLoadingAttendance;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh của tôi"
        description="Xem lịch sử điểm danh của bạn"
      />

      {error && <ErrorBanner message={error} />}

      {/* Filters */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lớp học
            </label>
            <select
              value={selectedClassId ?? ""}
              onChange={(e) =>
                setSelectedClassId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary"
            >
              {classOptions.length === 0 && (
                <option value="" disabled>
                  Không có lớp nào
                </option>
              )}
              {classOptions.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Ngày"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(
          (status) => (
            <StatCard
              key={status}
              label={STATUS_META[status].label}
              value={summary[status]}
            />
          ),
        )}
      </div>

      {/* Attendance Details */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : classOptions.length === 0 ? (
        <EmptyState message="Bạn chưa được đăng ký vào lớp nào." icon="📚" />
      ) : attendanceRecords.length === 0 ? (
        <EmptyState
          message={`Chưa có dữ liệu điểm danh cho ${selectedClassName} vào ngày ${date}.`}
          icon="📭"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedClassName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {attendanceRecords.length} bản ghi · {date}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {attendanceRecords
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {record.date}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                            STATUS_META[record.status]?.className ??
                            "border-gray-300 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {STATUS_META[record.status]?.label ?? record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.note || "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
