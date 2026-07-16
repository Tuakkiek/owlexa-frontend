import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { classApi } from "../../api/classApi";
import { attendanceApi } from "../../api/attendanceApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
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
        scheduleApi.findAllForOwner(),
        classApi.findAllClassesWithStudentsForOwner(),
      ]);

      setSchedules(scheduleData);
      setClasses(classData);

      if (scheduleData.length > 0) {
        setSelectedScheduleId(scheduleData[0].id);
        setSelectedTeacherId(scheduleData[0].teacherUserId);
      } else {
        setSelectedScheduleId(null);
        setSelectedTeacherId(null);
      }
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

  // Filtered schedules based on selected teacher
  const filteredSchedules = useMemo(
    () =>
      selectedTeacherId !== null
        ? schedules.filter((s) => s.teacherUserId === selectedTeacherId)
        : schedules,
    [schedules, selectedTeacherId],
  );

  // When teacher changes, pick the first matching schedule
  useEffect(() => {
    if (selectedTeacherId !== null) {
      const match = schedules.find(
        (s) => s.teacherUserId === selectedTeacherId,
      );
      if (match) {
        setSelectedScheduleId(match.id);
      }
    }
  }, [selectedTeacherId, schedules]);

  // Auto-select first schedule when filtered list changes
  useEffect(() => {
    if (filteredSchedules.length > 0) {
      const stillExists = filteredSchedules.some(
        (s) => s.id === selectedScheduleId,
      );
      if (!stillExists) {
        setSelectedScheduleId(filteredSchedules[0].id);
      }
    } else {
      setSelectedScheduleId(null);
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

  // Unique teachers from schedules for filter dropdown
  const teachers = useMemo(() => {
    const map = new Map<number, { id: number; name: string; phone: string }>();
    schedules.forEach((s) => {
      if (!map.has(s.teacherUserId)) {
        map.set(s.teacherUserId, {
          id: s.teacherUserId,
          name: s.teacherUserFullName,
          phone: s.teacherPhoneNumber,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [schedules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Điểm danh</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Filters: Teacher + Schedule + Date */}
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.5fr_1fr_0.8fr]">
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary"
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary"
          >
            <option value="" disabled>
              Chọn buổi học
            </option>
            {filteredSchedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {DAY_LABELS[schedule.dayOfWeek]} · {schedule.className} ·{" "}
                {schedule.startTime.slice(0, 5)}-{schedule.endTime.slice(0, 5)}{" "}
                · {schedule.teacherUserFullName}
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

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-sm font-medium text-gray-700">
            Thông tin buổi học
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {selectedSchedule ? (
              <>
                {currentDayName} · {selectedSchedule.className}
                <br />
                {selectedSchedule.teacherUserFullName}
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
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(
          (status) => (
            <div
              key={status}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {STATUS_META[status].label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {summary[status]}
              </p>
            </div>
          ),
        )}
      </div>

      {/* Student list */}
      {isLoading || isLoadingAttendance ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : !selectedSchedule ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Chưa có buổi học nào để điểm danh.
        </div>
      ) : !selectedClass ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Không tìm thấy danh sách học sinh của lớp này.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-600">
          Chưa có học sinh nào trong lớp hoặc chưa có dữ liệu điểm danh cho ngày
          này.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Học sinh trong lớp {selectedClass.className}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {rows.length} học sinh · {DAY_LABELS[selectedSchedule.dayOfWeek]}{" "}
              · {date}
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {rows.map((row) => (
              <div
                key={row.studentUserId}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1fr_1.4fr] lg:items-center"
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
                  {(
                    [
                      "PRESENT",
                      "ABSENT",
                      "LATE",
                      "EXCUSED",
                    ] as AttendanceStatus[]
                  ).map((status) => {
                    const active = row.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateRow(row.studentUserId, { status })}
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                          active
                            ? STATUS_META[status].className
                            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
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
                    onChange={(e) =>
                      updateRow(row.studentUserId, { note: e.target.value })
                    }
                    placeholder="Ghi chú thêm..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
            <Button onClick={handleSave} isLoading={isSaving}>
              Lưu điểm danh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
