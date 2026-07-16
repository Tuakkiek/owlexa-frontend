import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { classApi } from "../../api/classApi";
import { attendanceApi } from "../../api/attendanceApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  PageHeader,
  ErrorBanner,
  StatCard,
  LoadingSkeleton,
  EmptyState,
  Card,
} from "../../components/ui/SharedComponents";
import type {
  AttendanceMarkRequest,
  AttendanceResponse,
  AttendanceStatus,
} from "../../types/attendance";
import { STATUS_META } from "../../types/attendance";
import type { ScheduleResponse } from "../../types/schedule";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";
import { DAY_LABELS } from "../../types/schedule";

interface AttendanceRow {
  studentUserId: number;
  studentFullName: string;
  studentPhoneNumber: string;
  status: AttendanceStatus;
  note: string;
}

export default function TeacherAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [scheduleData, classData] = await Promise.all([
        scheduleApi.findMySchedulesAsTeacher(),
        classApi.findMyClassesWithStudentsAsTeacher(),
      ]);

      setSchedules(scheduleData);
      setClasses(classData);
      setSelectedScheduleId(
        (current) => current ?? scheduleData[0]?.id ?? null,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedSchedule = useMemo(
    () =>
      schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedSchedule?.classId) ?? null,
    [classes, selectedSchedule?.classId],
  );

  const loadAttendance = useCallback(async () => {
    if (!selectedSchedule || !selectedClass) {
      setRows([]);
      return;
    }

    try {
      setIsLoadingAttendance(true);
      setError("");
      const attendance = await attendanceApi.findAllBySchedule(
        selectedSchedule.id,
        date,
      );

      const attendanceMap = new Map<number, AttendanceResponse>();
      attendance.forEach((item) => attendanceMap.set(item.studentUserId, item));

      setRows(
        selectedClass.students.map((student) => {
          const existing = attendanceMap.get(student.userId);
          return {
            studentUserId: student.userId,
            studentFullName: student.fullName,
            studentPhoneNumber: student.phoneNumber,
            status: existing?.status ?? "PRESENT",
            note: existing?.note ?? "",
          };
        }),
      );
      setSuccess("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách điểm danh.",
      );
      setRows([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedClass, selectedSchedule, date]);

  useEffect(() => {
    if (!selectedSchedule || !selectedClass) {
      setRows([]);
      return;
    }
    loadAttendance();
  }, [loadAttendance, selectedClass, selectedSchedule]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc[row.status] += 1;
        return acc;
      },
      { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 },
    );
  }, [rows]);

  const updateRow = (
    studentUserId: number,
    patch: Partial<Pick<AttendanceRow, "status" | "note">>,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.studentUserId === studentUserId ? { ...row, ...patch } : row,
      ),
    );
  };

  const handleSave = async () => {
    if (!selectedSchedule || rows.length === 0) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const request: AttendanceMarkRequest = {
        date,
        records: rows.map((row) => ({
          studentUserId: row.studentUserId,
          status: row.status,
          note: row.note.trim() || undefined,
        })),
      };

      await attendanceApi.markAttendance(selectedSchedule.id, request);
      setSuccess("Đã lưu điểm danh thành công.");
      await loadAttendance();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu điểm danh.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentDayName = selectedSchedule
    ? (DAY_LABELS[selectedSchedule.dayOfWeek] ?? "Không rõ")
    : "";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Điểm danh" />

      {error && <ErrorBanner message={error} />}

      {success && (
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <Card className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Buổi học
          </label>
          <select
            value={selectedScheduleId ?? ""}
            onChange={(event) =>
              setSelectedScheduleId(Number(event.target.value))
            }
            className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
          >
            <option value="" disabled>
              Chọn buổi học
            </option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {DAY_LABELS[schedule.dayOfWeek]} · {schedule.className} ·{" "}
                {schedule.startTime.slice(0, 5)}-{schedule.endTime.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Ngày điểm danh"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />

        <div className="rounded-input border border-surface-border bg-surface-hover px-4 py-3">
          <div className="text-sm font-medium text-gray-700">
            Thông tin buổi học
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {selectedSchedule ? (
              <>
                {currentDayName} · {selectedSchedule.className}
                <br />
                Phòng {selectedSchedule.roomName} ·{" "}
                {selectedSchedule.startTime.slice(0, 5)}-
                {selectedSchedule.endTime.slice(0, 5)}
              </>
            ) : (
              "Chưa chọn buổi học"
            )}
          </div>
        </div>

        <Button
          onClick={loadAttendance}
          isLoading={isLoadingAttendance}
          variant="secondary"
          className="self-end"
          disabled={!selectedScheduleId}
        >
          Tải danh sách
        </Button>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["PRESENT", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map(
          (status) => (
            <StatCard
              key={status}
              label={STATUS_META[status].label}
              value={summary[status]}
            />
          ),
        )}
      </div>

      {isLoading || isLoadingAttendance ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : !selectedSchedule ? (
        <EmptyState message="Chưa có buổi học nào để điểm danh." />
      ) : !selectedClass ? (
        <EmptyState message="Không tìm thấy danh sách học sinh của lớp này." />
      ) : rows.length === 0 ? (
        <EmptyState message="Chưa có học sinh nào trong lớp hoặc chưa có dữ liệu điểm danh cho ngày này." />
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Học sinh trong lớp {selectedClass.className}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {rows.length} học sinh · {DAY_LABELS[selectedSchedule.dayOfWeek]}{" "}
              · {date}
            </p>
          </div>

          <div className="divide-y divide-surface-border">
            {rows.map((row) => (
              <div
                key={row.studentUserId}
                className="grid gap-4 px-6 py-4 lg:grid-cols-[1.2fr_1fr_1.4fr] lg:items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {row.studentFullName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {row.studentPhoneNumber}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["PRESENT", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map(
                    (status) => {
                      const active = row.status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            updateRow(row.studentUserId, { status })
                          }
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                            active
                              ? STATUS_META[status].className
                              : "border-surface-border bg-white text-gray-600 hover:bg-surface-hover"
                          }`}
                        >
                          {STATUS_META[status].label}
                        </button>
                      );
                    },
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={row.note}
                    onChange={(event) =>
                      updateRow(row.studentUserId, { note: event.target.value })
                    }
                    placeholder="Ghi chú thêm..."
                    className="w-full rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end border-t border-surface-border bg-surface-hover px-6 py-4">
            <Button onClick={handleSave} isLoading={isSaving}>
              Lưu điểm danh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
