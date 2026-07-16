import { useCallback, useEffect, useMemo, useState } from "react";
import { teacherApi } from "../../api/teacherApi";
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
import type { TeacherResponse } from "../../types/teacher";
import type {
  TeacherAttendanceResponse,
  TeacherAttendanceStatus,
} from "../../types/teacherAttendance";
import { TEACHER_STATUS_META } from "../../types/teacherAttendance";

interface TeacherRow {
  teacherUserId: number;
  teacherFullName: string;
  teacherPhoneNumber: string;
  status: TeacherAttendanceStatus;
  note: string;
  attendanceId: number | null;
}

const ALL_STATUSES: TeacherAttendanceStatus[] = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "LEAVE",
];

export default function OwnerTeacherAttendancePage() {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load all teachers
  const loadTeachers = useCallback(async () => {
    try {
      setIsLoadingTeachers(true);
      setError("");
      const data = await teacherApi.findAll();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải danh sách giáo viên.",
      );
    } finally {
      setIsLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Load existing attendance for the selected date
  const loadAttendance = useCallback(async () => {
    if (teachers.length === 0) return;
    try {
      setIsLoadingAttendance(true);
      setError("");
      const records = await teacherAttendanceApi.findAll({ date });
      const recordMap = new Map<number, TeacherAttendanceResponse>();
      records.forEach((r) => recordMap.set(r.teacherUserId, r));

      setRows(
        teachers.map((t) => {
          const record = recordMap.get(t.id);
          return {
            teacherUserId: t.id,
            teacherFullName: t.fullName ?? t.phoneNumber ?? "",
            teacherPhoneNumber: t.phoneNumber ?? "",
            status: record?.status ?? ("PRESENT" as TeacherAttendanceStatus),
            note: record?.note ?? "",
            attendanceId: record?.id ?? null,
          };
        }),
      );
      setSuccess("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.",
      );
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [teachers, date]);

  useEffect(() => {
    if (teachers.length > 0) loadAttendance();
  }, [loadAttendance, teachers.length]);

  // Update a row locally
  const updateRow = (
    teacherUserId: number,
    patch: Partial<Pick<TeacherRow, "status" | "note">>,
  ) => {
    setRows((current) =>
      current.map((r) =>
        r.teacherUserId === teacherUserId ? { ...r, ...patch } : r,
      ),
    );
  };

  // Save all
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await teacherAttendanceApi.mark({
        date,
        records: rows.map((r) => ({
          teacherUserId: r.teacherUserId,
          status: r.status,
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

  // Summary stats
  const summary = useMemo(() => {
    const counts: Record<TeacherAttendanceStatus, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      LEAVE: 0,
    };
    rows.forEach((r) => {
      counts[r.status] += 1;
    });
    return counts;
  }, [rows]);

  const isLoading = isLoadingTeachers || isLoadingAttendance;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh giáo viên"
        description="Quản lý chấm công giáo viên theo ngày"
      >
        {rows.length > 0 && (
          <Button onClick={handleSave} isLoading={isSaving}>
            💾 Lưu điểm danh
          </Button>
        )}
      </PageHeader>

      {error && <ErrorBanner message={error} />}

      {success && (
        <div className="rounded-input border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Date Picker */}
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
              {rows.length} giáo viên · {date}
            </p>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {ALL_STATUSES.map((status) => (
          <StatCard
            key={status}
            label={TEACHER_STATUS_META[status].label}
            value={summary[status]}
          />
        ))}
      </div>

      {/* Teacher Attendance Table */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          message="Chưa có giáo viên nào trong trung tâm."
          icon="👨‍🏫"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách giáo viên
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {rows.length} giáo viên
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-page">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Giáo viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Ghi chú
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((row) => (
                  <tr
                    key={row.teacherUserId}
                    className="hover:bg-surface-hover"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {row.teacherFullName}
                      </p>
                      <p className="text-sm text-gray-500">
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
                              onClick={() =>
                                updateRow(row.teacherUserId, { status })
                              }
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
                          updateRow(row.teacherUserId, {
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
              💾 Lưu điểm danh
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
