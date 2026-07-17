import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { classApi } from "../../api/classApi";
import { attendanceApi } from "../../api/attendanceApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeader,
  StatCard,
  Card,
  ErrorBanner,
  LoadingSkeleton,
  EmptyState,
} from "../../components/ui/SharedComponents";
import type {
  AttendanceResponse,
  AttendanceStatus,
} from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";
import type { ScheduleResponse } from "../../types/schedule";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";
import { DAY_LABELS } from "../../types/schedule";

export default function OwnerAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(
    null,
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [error, setError] = useState("");

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [scheduleData, classData] = await Promise.all([
        scheduleApi.findAllForOwner(),
        classApi.findAllClassesWithStudentsForOwner(),
      ]);
      setSchedules(scheduleData);
      setClasses(classData);
      if (scheduleData.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(scheduleData[0].id);
        setSelectedTeacherId(scheduleData[0].teacherUserId);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter schedules by selected teacher
  const filteredSchedules = useMemo(
    () =>
      selectedTeacherId !== null
        ? schedules.filter((s) => s.teacherUserId === selectedTeacherId)
        : schedules,
    [schedules, selectedTeacherId],
  );

  // Auto-select first schedule when teacher filter changes
  useEffect(() => {
    if (selectedTeacherId !== null && filteredSchedules.length > 0) {
      const stillExists = filteredSchedules.some(
        (s) => s.id === selectedScheduleId,
      );
      if (!stillExists) {
        setSelectedScheduleId(filteredSchedules[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSchedules]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => s.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedSchedule?.classId) ?? null,
    [classes, selectedSchedule?.classId],
  );

  const loadAttendance = useCallback(async () => {
    if (!selectedSchedule) {
      setAttendanceRecords([]);
      return;
    }
    try {
      setIsLoadingAttendance(true);
      setError("");
      const records = await attendanceApi.findByScheduleOwner(
        selectedSchedule.id,
        date,
      );
      setAttendanceRecords(records);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách điểm danh.",
      );
      setAttendanceRecords([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedSchedule, date]);

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

  // Student list enriched with attendance status
  const studentRows = useMemo(() => {
    if (!selectedClass) return [];
    const recordMap = new Map<number, AttendanceResponse>();
    attendanceRecords.forEach((r) => recordMap.set(r.studentUserId, r));
    return selectedClass.students.map((s) => {
      const record = recordMap.get(s.userId);
      return {
        userId: s.userId,
        fullName: s.fullName,
        phoneNumber: s.phoneNumber,
        status: record?.status ?? ("ABSENT" as AttendanceStatus),
        note: record?.note ?? "",
        hasRecord: !!record,
      };
    });
  }, [selectedClass, attendanceRecords]);

  // Unique teachers from schedules
  const teachers = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    schedules.forEach((s) => {
      if (!map.has(s.teacherUserId)) {
        map.set(s.teacherUserId, {
          id: s.teacherUserId,
          name: s.teacherUserFullName,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [schedules]);

  // CSV Export
  const handleExportCSV = () => {
    if (studentRows.length === 0) return;
    const header = "Họ tên,SĐT,Trạng thái,Ghi chú";
    const rows = studentRows.map(
      (r) =>
        `"${r.fullName}","${r.phoneNumber}","${STATUS_META[r.status]?.label ?? r.status}","${r.note}"`,
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diem-danh-${selectedClass?.className ?? "lop"}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentDayName = selectedSchedule
    ? (DAY_LABELS[selectedSchedule.dayOfWeek] ?? "")
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh học sinh"
        description="Xem và xuất báo cáo điểm danh"
      >
        {studentRows.length > 0 && (
          <Button variant="secondary" onClick={handleExportCSV}>
            📥 Xuất CSV
          </Button>
        )}
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {/* Filters */}
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_1fr_1fr]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Giáo viên
            </label>
            <select
              value={selectedTeacherId ?? ""}
              onChange={(e) =>
                setSelectedTeacherId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="">Tất cả giáo viên</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Buổi học
            </label>
            <select
              value={selectedScheduleId ?? ""}
              onChange={(e) => setSelectedScheduleId(Number(e.target.value))}
              className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary"
            >
              <option value="" disabled>
                Chọn buổi học
              </option>
              {filteredSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {DAY_LABELS[schedule.dayOfWeek]} · {schedule.className} ·{" "}
                  {schedule.startTime.slice(0, 5)}-
                  {schedule.endTime.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Ngày điểm danh"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {selectedSchedule && (
            <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
              <p className="text-xs font-medium text-gray-500">Thông tin</p>
              <p className="mt-1 text-sm text-gray-700">
                {currentDayName} · {selectedSchedule.className}
              </p>
              <p className="text-sm text-gray-500">
                {selectedSchedule.teacherUserFullName} ·{" "}
                {selectedSchedule.roomName}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary stats */}
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

      {/* Student attendance list */}
      {isLoading || isLoadingAttendance ? (
        <LoadingSkeleton count={4} />
      ) : !selectedSchedule ? (
        <EmptyState message="Chọn một buổi học để xem điểm danh." icon="📅" />
      ) : !selectedClass || studentRows.length === 0 ? (
        <EmptyState
          message="Chưa có học sinh nào trong lớp hoặc chưa có dữ liệu điểm danh."
          icon="📭"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedClass.className}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {studentRows.length} học sinh · {currentDayName} · {date}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Học sinh
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
                {studentRows.map((row) => (
                  <tr key={row.userId} className="hover:bg-surface-hover">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {row.fullName}
                      </p>
                      <p className="text-sm text-gray-500">{row.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          row.hasRecord
                            ? STATUS_META[row.status].className
                            : "border-gray-300 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {row.hasRecord
                          ? STATUS_META[row.status].label
                          : "Chưa điểm danh"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {row.note || "—"}
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
