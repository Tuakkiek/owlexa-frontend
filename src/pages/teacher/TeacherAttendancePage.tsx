import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { classApi } from "../../api/classApi";
import { attendanceApi } from "../../api/attendanceApi";
import { Button } from "../../components/ui/Button";
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
import type { ScheduleResponse } from "../../types/schedule";
import type { TeacherClassStudents } from "../../types/teacherClassStudents";

interface AttendanceRow {
  studentUserId: number;
  studentFullName: string;
  studentPhoneNumber: string;
  status: AttendanceStatus;
  note: string;
}

const DAY_LABELS: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  PRESENT: {
    label: "Có mặt",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  ABSENT: {
    label: "Vắng",
    className: "border-rose-300 bg-rose-50 text-rose-700",
  },
  LATE: {
    label: "Muộn",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  EXCUSED: {
    label: "Xin phép",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
};

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value?: string | null) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatDate(value?: string | null) {
  const date = parseLocalDate(value);
  if (!date) return "";

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "--:--";
}

function isAttendableSchedule(schedule: ScheduleResponse) {
  return schedule.type !== "CANCELLED" && schedule.eventStatus !== "CANCELLED";
}

function sortByDateAndTime(a: ScheduleResponse, b: ScheduleResponse) {
  return (
    (a.eventDate ?? "").localeCompare(b.eventDate ?? "") ||
    a.startTime.localeCompare(b.startTime)
  );
}

function pickDefaultSchedule(schedules: ScheduleResponse[]) {
  const todayKey = toDateKey(new Date());
  const active = schedules.filter(isAttendableSchedule).sort(sortByDateAndTime);

  return (
    active.find((schedule) => schedule.eventDate === todayKey) ??
    active.find((schedule) => (schedule.eventDate ?? "") >= todayKey) ??
    active[0] ??
    null
  );
}

export default function TeacherAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassStudents[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [date, setDate] = useState(toDateKey(new Date()));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const visibleSchedules = useMemo(
    () => schedules.filter(isAttendableSchedule).sort(sortByDateAndTime),
    [schedules],
  );

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [scheduleData, classData] = await Promise.all([
        scheduleApi.findMySchedulesAsTeacher(),
        classApi.findMyClassesWithStudentsAsTeacher(),
      ]);

      const defaultSchedule = pickDefaultSchedule(scheduleData);

      setSchedules(scheduleData);
      setClasses(classData);
      setSelectedScheduleId((current) => current ?? defaultSchedule?.id ?? null);
      setDate((current) => defaultSchedule?.eventDate ?? current);
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
      visibleSchedules.find((schedule) => schedule.id === selectedScheduleId) ??
      null,
    [visibleSchedules, selectedScheduleId],
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

  const handleScheduleChange = (scheduleId: number) => {
    const schedule = visibleSchedules.find((item) => item.id === scheduleId);
    setSelectedScheduleId(scheduleId);
    if (schedule?.eventDate) {
      setDate(schedule.eventDate);
    }
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

      <Card className="grid gap-4 lg:grid-cols-[minmax(280px,1.4fr)_220px_minmax(260px,0.8fr)_auto] lg:items-end">
        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Buổi học
          </label>
          <select
            value={selectedScheduleId ?? ""}
            onChange={(event) => handleScheduleChange(Number(event.target.value))}
            className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
          >
            <option value="" disabled>
              Chọn buổi học
            </option>
            {visibleSchedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {formatDate(schedule.eventDate)} · {schedule.className} ·{" "}
                {formatTime(schedule.startTime)}-{formatTime(schedule.endTime)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ngày điểm danh
          </label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 w-full rounded-input border border-surface-border bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="min-w-0 rounded-input border border-surface-border bg-surface-hover px-4 py-3">
          <div className="text-sm font-medium text-gray-700">
            Thông tin buổi học
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {selectedSchedule ? (
              <>
                {currentDayName} · {formatDate(selectedSchedule.eventDate)}
                <br />
                {selectedSchedule.className}
                <br />
                Phòng {selectedSchedule.roomName || "Chưa gán"} ·{" "}
                {formatTime(selectedSchedule.startTime)}-
                {formatTime(selectedSchedule.endTime)}
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

      <div className="grid gap-4 sm:grid-cols-4">
        {ATTENDANCE_STATUSES.map((status) => (
          <StatCard
            key={status}
            label={STATUS_META[status].label}
            value={summary[status]}
          />
        ))}
      </div>

      {isLoading || isLoadingAttendance ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : !selectedSchedule ? (
        <EmptyState message="Chưa có buổi học nào để điểm danh." />
      ) : !selectedClass ? (
        <EmptyState message="Không tìm thấy danh sách học sinh của lớp này." />
      ) : rows.length === 0 ? (
        <EmptyState message="Chưa có học sinh nào trong lớp này." />
      ) : (
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Học sinh trong lớp {selectedClass.className}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {rows.length} học sinh · {currentDayName} · {formatDate(date)}
            </p>
          </div>

          <div className="divide-y divide-surface-border">
            {rows.map((row) => (
              <div
                key={row.studentUserId}
                className="grid gap-4 px-6 py-4 lg:grid-cols-[1.2fr_1.1fr_1.4fr] lg:items-center"
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
                  {ATTENDANCE_STATUSES.map((status) => {
                    const active = row.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateRow(row.studentUserId, { status })}
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                          active
                            ? STATUS_META[status].className
                            : "border-surface-border bg-white text-gray-600 hover:bg-surface-hover"
                        }`}
                      >
                        {STATUS_META[status].label}
                      </button>
                    );
                  })}
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
