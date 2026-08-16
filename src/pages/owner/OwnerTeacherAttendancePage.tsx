import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, Trash2, CheckCircle, Clock3 } from "lucide-react";
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

  const updateRow = (
    key: string,
    patch: Partial<Pick<SessionRow, "status" | "note">>,
  ) => {
    setRows((current) =>
      current.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

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

  const groupedSessions = useMemo(() => {
    const morning: SessionRow[] = [];
    const afternoon: SessionRow[] = [];
    const evening: SessionRow[] = [];

    rows.forEach(row => {
      const hour = parseInt(row.startTime.split(':')[0], 10);
      if (hour < 12) {
        morning.push(row);
      } else if (hour < 17) {
        afternoon.push(row);
      } else {
        evening.push(row);
      }
    });

    return { Sáng: morning, Chiều: afternoon, Tối: evening };
  }, [rows]);

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
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Điểm danh giáo viên"
        description="Quản lý chấm công giáo viên theo ca dạy"
      />

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Date Picker Toolbar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handlePrevDay}>&lt; Ngày trước</Button>
            <div className="w-48">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleNextDay}>Ngày sau &gt;</Button>
          </div>
          <div className="text-sm font-medium text-gray-500">
            {rows.length} ca dạy · Ngày {formatDateDisplay(date)}
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
        <LoadingSkeleton count={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          message="Không có ca dạy"
          icon={CalendarDays}
        >
          <p className="mt-1 text-xs text-gray-400">
            Không có giáo viên nào được xếp lịch dạy trong ngày này.
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSessions).map(([period, periodSessions]) => {
            if (periodSessions.length === 0) return null;
            return (
              <div key={period} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-surface-border pb-2">
                  Ca {period}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {periodSessions.map(row => (
                    <div
                      key={row.key}
                      className="group rounded-xl border border-surface-border bg-white p-5 transition-all hover:border-primary hover:shadow-md flex flex-col"
                    >
                      {/* Header info */}
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {row.className}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(row.startTime)} - {formatTime(row.endTime)}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status !== null
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                        }`}>
                          {row.status !== null ? (
                            <><CheckCircle className="h-3.5 w-3.5" /> Đã điểm danh</>
                          ) : (
                            <><Clock3 className="h-3.5 w-3.5" /> Chưa điểm danh</>
                          )}
                        </span>
                      </div>
                      
                      {/* Teacher and Room info */}
                      <div className="mb-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{row.teacherFullName}</span>
                          {row.attendanceId && (
                            <button
                              onClick={() => handleDelete(row.attendanceId!)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Xóa điểm danh"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span>Phòng {row.roomName}</span>
                        </div>
                      </div>

                      {/* Interactive marking section */}
                      <div className="mt-auto space-y-3 border-t border-surface-border pt-4">
                        <div className="flex flex-wrap gap-2">
                          {ALL_STATUSES.map((status) => {
                            const active = row.status === status;
                            const meta = TEACHER_STATUS_META[status];
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateRow(row.key, { status })}
                                className={`rounded-btn border px-3 py-1.5 text-xs font-medium transition flex-1 text-center ${
                                  active
                                    ? meta.className
                                    : "border-surface-border bg-white text-gray-500 hover:bg-surface-hover hover:text-gray-900"
                                }`}
                              >
                                {meta.label}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) =>
                            updateRow(row.key, {
                              note: e.target.value,
                            })
                          }
                          placeholder="Thêm ghi chú..."
                          className="w-full rounded-input border border-surface-border bg-gray-50/50 px-3 py-2 text-sm text-gray-900 outline-none focus:bg-white focus:border-primary transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Button */}
      {rows.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 flex items-center justify-between border-t border-surface-border bg-white/80 backdrop-blur-md px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <p className="text-sm text-gray-600 hidden sm:block">
            Đã điểm danh: <span className="font-semibold text-gray-900">{rows.filter(r => r.status !== null).length}/{rows.length}</span> ca dạy
          </p>
          <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto shadow-sm">
            Lưu điểm danh ({rows.filter(r => r.status !== null).length})
          </Button>
        </div>
      )}
    </div>
  );
}
