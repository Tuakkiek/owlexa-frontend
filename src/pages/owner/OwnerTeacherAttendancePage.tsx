import { useCallback, useEffect, useMemo, useState } from "react";
import { teacherAttendanceApi } from "../../api/teacherAttendanceApi";
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
  TeacherAttendanceResponse,
  TeacherAttendanceStatus,
} from "../../types/teacherAttendance";
import { TEACHER_STATUS_META } from "../../types/teacherAttendance";

interface SessionRow {
  key: string;
  scheduleEventId: number;
  classId: number;
  className: string;
  roomId: number | null;
  roomName: string;
  startTime: string;
  endTime: string;
  teacherUserId: number;
  teacherFullName: string;
  teacherPhoneNumber: string;
  status: TeacherAttendanceStatus | null;
  note: string;
  attendanceId: number | null;
}

const ALL_STATUSES: TeacherAttendanceStatus[] = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "LEAVE",
];

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "--:--";
}

function formatDateDisplay(value: string) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function OwnerTeacherAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load schedule-driven attendance for the selected date
  const loadAttendance = useCallback(async () => {
    try {
      setIsLoadingAttendance(true);
      setError("");
      const records = await teacherAttendanceApi.findAll({ date });

      setRows(
        records.map((r: TeacherAttendanceResponse) => ({
          key: `${r.scheduleEventId ?? r.id ?? Math.random()}-${r.teacherUserId}`,
          scheduleEventId: r.scheduleEventId ?? 0,
          classId: r.classId ?? 0,
          className: r.className ?? "Lớp học",
          roomId: r.roomId ?? null,
          roomName: r.roomName ?? "Chưa gán",
          startTime: r.startTime ?? "",
          endTime: r.endTime ?? "",
          teacherUserId: r.teacherUserId,
          teacherFullName: r.teacherFullName ?? r.teacherPhoneNumber ?? "",
          teacherPhoneNumber: r.teacherPhoneNumber ?? "",
          status: r.status,
          note: r.note ?? "",
          attendanceId: r.id ?? null,
        })),
      );
      setSuccess("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Update a row locally
  const updateRow = (
    key: string,
    patch: Partial<Pick<SessionRow, "status" | "note">>,
  ) => {
    setRows((current) =>
      current.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  // Save all marked sessions
  const handleSave = async () => {
    const markedRows = rows.filter((r) => r.status !== null);
    if (markedRows.length === 0) {
      setError("Vui lòng điểm danh ít nhất một ca dạy trước khi lưu.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await teacherAttendanceApi.mark({
        date,
        records: markedRows.map((r) => ({
          scheduleEventId: r.scheduleEventId > 0 ? r.scheduleEventId : undefined,
          teacherUserId: r.teacherUserId,
          status: r.status!,
          note: r.note.trim() || undefined,
        })),
      });

      setSuccess("Đã lưu điểm danh giáo viên thành công.");
      await loadAttendance();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể lưu điểm danh.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a single record
  const handleDelete = async (attendanceId: number) => {
    if (!confirm("Xóa bản ghi điểm danh này?")) return;
    try {
      setError("");
      await teacherAttendanceApi.delete(attendanceId);
      setSuccess("Đã xóa bản ghi điểm danh.");
      await loadAttendance();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Không thể xóa bản ghi.");
    }
  };

  // Summary stats based on total teaching assignments on this date
  const summary = useMemo(() => {
    const counts = {
      TOTAL: rows.length,
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      LEAVE: 0,
      UNMARKED: 0,
    };
    rows.forEach((r) => {
      if (r.status === "PRESENT") counts.PRESENT += 1;
      else if (r.status === "LATE") counts.LATE += 1;
      else if (r.status === "ABSENT") counts.ABSENT += 1;
      else if (r.status === "LEAVE") counts.LEAVE += 1;
      else counts.UNMARKED += 1;
    });
    return counts;
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh giáo viên"
        description="Quản lý chấm công giáo viên theo ca dạy"
      >
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {success && (
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Date Picker Toolbar */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Ngày chấm công"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="rounded-input border border-surface-border bg-surface-page px-4 py-3">
            <p className="text-xs text-gray-500">
              {rows.length} ca dạy · {formatDateDisplay(date)}
            </p>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <StatCard label="Tổng ca dạy" value={summary.TOTAL} />
        <StatCard label="Có mặt" value={summary.PRESENT} />
        <StatCard label="Muộn" value={summary.LATE} />
        <StatCard label="Vắng" value={summary.ABSENT} />
        <StatCard label="Xin phép" value={summary.LEAVE} />
      </div>

      {/* Teaching Session List */}
      {isLoadingAttendance ? (
        <LoadingSkeleton count={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          message="Không có ca dạy"
          icon="📅"
        >
          <p className="mt-1 text-xs text-gray-400">
            Không có giáo viên nào được xếp lịch dạy trong ngày này.
          </p>
        </EmptyState>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách ca dạy ngày {formatDateDisplay(date)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {rows.length} ca dạy cần điểm danh
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Buổi học & Phòng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Giáo viên phân công
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Trạng thái điểm danh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-surface-hover">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {row.className}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(row.startTime)} – {formatTime(row.endTime)}
                        {" · "}
                        Phòng {row.roomName}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {row.teacherFullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.teacherPhoneNumber}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map((status) => {
                          const active = row.status === status;
                          const meta = TEACHER_STATUS_META[status];
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => updateRow(row.key, { status })}
                              className={`rounded-btn border px-3 py-1 text-xs font-medium transition ${
                                active
                                  ? meta.className
                                  : "border-surface-border bg-white text-gray-500 hover:bg-surface-hover"
                              }`}
                            >
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) =>
                          updateRow(row.key, {
                            note: e.target.value,
                          })
                        }
                        placeholder="Ghi chú..."
                        className="w-full min-w-[120px] rounded-input border border-surface-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary"
                      />
                    </td>

                    <td className="px-6 py-4 text-right">
                      {row.attendanceId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row.attendanceId!)}
                        >
                          🗑️
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom save bar */}
          <div className="flex items-center justify-end border-t border-surface-border bg-surface-page px-6 py-4">
            <Button onClick={handleSave} isLoading={isSaving}>
              Lưu điểm danh
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
